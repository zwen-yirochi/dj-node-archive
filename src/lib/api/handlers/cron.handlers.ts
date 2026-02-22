// lib/api/handlers/cron.handlers.ts
// Cron job 핸들러 — RA import된 베뉴의 예정 이벤트 자동 갱신

import { createServiceClient } from '@/lib/supabase/service';
import { fetchRAVenueUpcomingEvents } from '@/lib/services/ra.service';
import { mapRAEventToDbInput } from '@/lib/mappers';
import {
    findAllRAVenues,
    findExistingRAEventIds,
    findOriginalImporter,
    insertEvents,
    upsertStack,
    refreshStackStats,
} from '@/lib/db/queries/cron.queries';
import { isSuccess } from '@/types/result';
import { successResponse } from '@/lib/api/responses';
import { NextResponse } from 'next/server';

interface RefreshResult {
    venue: string;
    venueId: string;
    newEvents: number;
    stacksUpdated: number;
    error?: string;
}

/**
 * GET /api/cron/refresh-upcoming
 * RA import된 모든 베뉴의 예정 이벤트를 갱신
 *
 * 7-step 패턴 (cron 컨텍스트):
 * 1. Parse: N/A (request body 없음)
 * 2. Validate: CRON_SECRET 검증
 * 3. Verify: N/A (시스템 작업)
 * 4. Logic: RA API 호출 + 중복 필터
 * 5. Transform: DB 형식으로 변환
 * 6. Database: 이벤트 삽입 + 스택 갱신
 * 7. Response: 요약 응답
 */
export async function handleRefreshUpcomingEvents(request: Request) {
    // 2. Validate — CRON_SECRET 검증
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
            { status: 401 }
        );
    }

    const supabase = createServiceClient();

    // 4. Logic — RA import된 모든 베뉴 조회
    const venuesResult = await findAllRAVenues(supabase);
    if (!isSuccess(venuesResult)) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'DATABASE_ERROR', message: 'Failed to fetch RA venues' },
            },
            { status: 500 }
        );
    }

    const results: RefreshResult[] = [];

    for (const venue of venuesResult.data) {
        const raVenueId = venue.external_sources?.ra_venue_id;
        if (!raVenueId) continue;

        try {
            // 4a. RA에서 예정 이벤트 조회
            const raResult = await fetchRAVenueUpcomingEvents(raVenueId);
            if (!raResult.success || !raResult.data.venue) {
                results.push({
                    venue: venue.name,
                    venueId: venue.id,
                    newEvents: 0,
                    stacksUpdated: 0,
                    error: 'RA fetch failed',
                });
                continue;
            }

            // 4b. 기존 RA event ID 조회 (중복 방지)
            const existingIdsResult = await findExistingRAEventIds(supabase, venue.id);
            if (!isSuccess(existingIdsResult)) {
                results.push({
                    venue: venue.name,
                    venueId: venue.id,
                    newEvents: 0,
                    stacksUpdated: 0,
                    error: 'Failed to check existing events',
                });
                continue;
            }
            const existingIds = existingIdsResult.data;

            // 5. 이미 import된 이벤트 필터 → DB 형식 변환
            const newRAEvents = raResult.data.events.filter((e) => !existingIds.has(e.id));

            if (newRAEvents.length === 0) {
                results.push({
                    venue: venue.name,
                    venueId: venue.id,
                    newEvents: 0,
                    stacksUpdated: 0,
                });
                continue;
            }

            // created_by: 원래 import한 유저 사용
            const importerResult = await findOriginalImporter(supabase, venue.id);
            const createdBy =
                isSuccess(importerResult) && importerResult.data
                    ? importerResult.data
                    : (venue.claimed_by ?? '');

            if (!createdBy) {
                results.push({
                    venue: venue.name,
                    venueId: venue.id,
                    newEvents: 0,
                    stacksUpdated: 0,
                    error: 'No importer found',
                });
                continue;
            }

            const eventInputs = newRAEvents.map((raEvent) =>
                mapRAEventToDbInput(raEvent, venue.id, venue.name, createdBy)
            );

            // 6a. 새 이벤트 삽입
            const insertResult = await insertEvents(supabase, eventInputs);
            const inserted = isSuccess(insertResult) ? insertResult.data : [];

            // 6b. 스택 할당/갱신
            const updatedStackIds = new Set<string>();
            for (const event of inserted) {
                const stackResult = await upsertStack(supabase, venue.id, event.title);
                if (isSuccess(stackResult)) {
                    const stackId = stackResult.data.id;
                    // 이벤트에 stack_id 할당
                    await supabase.from('events').update({ stack_id: stackId }).eq('id', event.id);
                    updatedStackIds.add(stackId);
                }
            }

            // 갱신된 스택들의 집계 업데이트
            for (const stackId of updatedStackIds) {
                await refreshStackStats(supabase, stackId);
            }

            results.push({
                venue: venue.name,
                venueId: venue.id,
                newEvents: inserted.length,
                stacksUpdated: updatedStackIds.size,
            });
        } catch (err) {
            results.push({
                venue: venue.name,
                venueId: venue.id,
                newEvents: 0,
                stacksUpdated: 0,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        // RA API 보호: 베뉴 간 1초 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 7. 응답
    const totalNew = results.reduce((sum, r) => sum + r.newEvents, 0);
    return successResponse({
        refreshedVenues: results.length,
        totalNewEvents: totalNew,
        details: results,
    });
}
