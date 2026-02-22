// lib/api/handlers/import.handlers.ts
// Import 관련 핸들러 (7-step 패턴)

import type { AuthContext } from '@/lib/api/withAuth';
import {
    successResponse,
    internalErrorResponse,
    zodValidationErrorResponse,
} from '@/lib/api/responses';
import { isSuccess } from '@/types/result';
import {
    venueImportPreviewSchema,
    venueImportConfirmSchema,
} from '@/lib/validations/import.schemas';
import {
    parseRAVenueUrl,
    fetchRAVenueEvents,
    fetchAllRAVenueEvents,
} from '@/lib/services/ra.service';
import {
    findVenueByRAUrl,
    createImportedVenue,
    createImportedEvents,
    countUserImportsInWindow,
    countSystemImportsInWindow,
    createImportLog,
} from '@/lib/db/queries/import.queries';
import {
    upsertEventStack,
    assignStackToEvents,
    refreshStackSummary,
} from '@/lib/db/queries/event-stack.queries';
import { findUserByAuthId } from '@/lib/db/queries/user.queries';
import { mapRAVenueToDbInput, mapRAEventToDbInput } from '@/lib/mappers';
import type { Event as DBEvent } from '@/types/database';
import type { PreviewEventItem, VenueImportPreview, VenueImportResult } from '@/types/ra';
import { NextResponse } from 'next/server';

// Rate limit constants
const USER_RATE_LIMIT = 5; // 유저당 5회/시간
const SYSTEM_RATE_LIMIT = 30; // 시스템 30회/시간
const RATE_LIMIT_WINDOW_HOURS = 1;

/**
 * Rate Limit 체크 헬퍼
 */
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
    const userCountResult = await countUserImportsInWindow(userId, RATE_LIMIT_WINDOW_HOURS);
    if (!isSuccess(userCountResult)) {
        return { allowed: false, message: 'Rate limit 확인 중 오류가 발생했습니다.' };
    }
    if (userCountResult.data >= USER_RATE_LIMIT) {
        return {
            allowed: false,
            message: `시간당 최대 ${USER_RATE_LIMIT}회까지 Import할 수 있습니다. 잠시 후 다시 시도해주세요.`,
        };
    }

    const systemCountResult = await countSystemImportsInWindow(RATE_LIMIT_WINDOW_HOURS);
    if (!isSuccess(systemCountResult)) {
        return { allowed: false, message: 'Rate limit 확인 중 오류가 발생했습니다.' };
    }
    if (systemCountResult.data >= SYSTEM_RATE_LIMIT) {
        return {
            allowed: false,
            message: '현재 Import 요청이 많습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    return { allowed: true };
}

/**
 * RA 이벤트를 Preview 형식으로 변환
 */
function toPreviewEvent(raEvent: {
    title: string;
    date: string;
    contentUrl: string | null;
    artists: { name: string; urlSafeName: string | null }[];
}): PreviewEventItem {
    return {
        title: raEvent.title,
        date: raEvent.date,
        lineupText: raEvent.artists.map((a) => a.name).join(', '),
        artistDetails: raEvent.artists.map((a) => ({
            name: a.name,
            raUrl: a.urlSafeName ? `https://ra.co/dj/${a.urlSafeName}` : null,
        })),
        raEventUrl: raEvent.contentUrl ? `https://ra.co${raEvent.contentUrl}` : null,
    };
}

/**
 * POST /api/import/venue/preview
 * RA URL → 미리보기 데이터 반환 (DB 저장 없음)
 */
export async function handleVenueImportPreview(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = venueImportPreviewSchema.safeParse(body);
    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }
    const { ra_url } = parsed.data;

    // URL 파싱
    const urlResult = parseRAVenueUrl(ra_url);
    if (!urlResult.success) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: urlResult.error.message },
            },
            { status: 400 }
        );
    }
    const { venueId } = urlResult.data;

    // 3. Rate Limit 체크
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = userResult.data.id;

    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { success: false, error: { code: 'RATE_LIMIT', message: rateLimit.message } },
            { status: 429 }
        );
    }

    // 4. 중복 체크
    const existingResult = await findVenueByRAUrl(ra_url);
    if (!isSuccess(existingResult)) {
        return internalErrorResponse(existingResult.error.message);
    }
    if (existingResult.data) {
        const existing = existingResult.data;
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: '이미 등록된 베뉴입니다.',
                    existingVenue: {
                        id: existing.id,
                        name: existing.name,
                        slug: existing.slug,
                    },
                },
            },
            { status: 409 }
        );
    }

    // 5. RA API 호출 (Preview용 50건)
    const raResult = await fetchRAVenueEvents(venueId);
    if (!raResult.success) {
        return NextResponse.json(
            { success: false, error: { code: 'NETWORK_ERROR', message: raResult.error.message } },
            { status: 502 }
        );
    }

    const { venue: raVenue, events: raEvents, totalResults } = raResult.data;

    if (!raVenue) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'RA에서 해당 베뉴를 찾을 수 없습니다.' },
            },
            { status: 404 }
        );
    }

    // 6. Preview 변환
    const preview: VenueImportPreview = {
        venue: {
            name: raVenue.name,
            city: raVenue.area?.name ?? null,
            country: raVenue.area?.country?.name ?? null,
            address: raVenue.address,
            raUrl: ra_url,
        },
        events: {
            totalCount: totalResults,
            items: raEvents.map(toPreviewEvent),
        },
    };

    // 7. 응답
    return successResponse(preview);
}

/**
 * POST /api/import/venue/confirm
 * RA URL → 베뉴 + 이벤트 DB 저장
 */
export async function handleVenueImportConfirm(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = venueImportConfirmSchema.safeParse(body);
    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }
    const { ra_url, options } = parsed.data;
    const maxEvents = options?.maxEvents ?? 500;

    // URL 파싱
    const urlResult = parseRAVenueUrl(ra_url);
    if (!urlResult.success) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: urlResult.error.message },
            },
            { status: 400 }
        );
    }
    const { venueId } = urlResult.data;

    // 3. Rate Limit + 중복 체크
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = userResult.data.id;

    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { success: false, error: { code: 'RATE_LIMIT', message: rateLimit.message } },
            { status: 429 }
        );
    }

    const existingResult = await findVenueByRAUrl(ra_url);
    if (!isSuccess(existingResult)) {
        return internalErrorResponse(existingResult.error.message);
    }
    if (existingResult.data) {
        const existing = existingResult.data;
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: '이미 등록된 베뉴입니다.',
                    existingVenue: {
                        id: existing.id,
                        name: existing.name,
                        slug: existing.slug,
                    },
                },
            },
            { status: 409 }
        );
    }

    // 4. RA API 전체 수집 (과거 + 예정 병렬 조회)
    const raResult = await fetchAllRAVenueEvents(venueId, maxEvents);
    if (!raResult.success) {
        return NextResponse.json(
            { success: false, error: { code: 'NETWORK_ERROR', message: raResult.error.message } },
            { status: 502 }
        );
    }

    const { venue: raVenue, pastEvents, upcomingEvents } = raResult.data;

    if (!raVenue) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'RA에서 해당 베뉴를 찾을 수 없습니다.' },
            },
            { status: 404 }
        );
    }

    // 5. DB 매핑
    const venueInput = mapRAVenueToDbInput(raVenue, ra_url);
    const venueCreateResult = await createImportedVenue(venueInput);
    if (!isSuccess(venueCreateResult)) {
        // 동시 Import로 인한 unique constraint 충돌
        if (venueCreateResult.error.code === 'CONFLICT') {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'CONFLICT', message: venueCreateResult.error.message },
                },
                { status: 409 }
            );
        }
        return internalErrorResponse(venueCreateResult.error.message);
    }

    const createdVenue = venueCreateResult.data;

    // 6. 이벤트 생성 (과거 + 예정)
    const allRAEvents = [...pastEvents, ...upcomingEvents];
    const eventInputs = allRAEvents.map((raEvent) =>
        mapRAEventToDbInput(raEvent, createdVenue.id, createdVenue.name, userId)
    );

    const eventsResult = await createImportedEvents(eventInputs);
    const importedEvents = isSuccess(eventsResult) ? eventsResult.data : [];

    // 6.5 이벤트 스택 생성
    const stacksCreated = await createStacksForEvents(importedEvents, createdVenue.id);

    // Import 로그 기록 (실패해도 전체 응답에는 영향 없음)
    await createImportLog({
        user_id: userId,
        ra_url,
        venue_id: createdVenue.id,
        event_count: importedEvents.length,
    });

    // 7. 응답
    const result: VenueImportResult = {
        venue: {
            id: createdVenue.id,
            name: createdVenue.name,
            slug: createdVenue.slug,
        },
        importedEventsCount: importedEvents.length,
        importedUpcomingCount: upcomingEvents.length,
        stacksCreated,
    };

    return successResponse(result, 201);
}

/**
 * 이벤트를 title 기준으로 그룹핑 → 2개 이상인 그룹에 대해 스택 생성/할당
 */
async function createStacksForEvents(events: DBEvent[], venueId: string): Promise<number> {
    // title별 그룹핑 (case-insensitive)
    const groups = new Map<string, DBEvent[]>();
    for (const event of events) {
        const key = event.title.toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(event);
    }

    let stackCount = 0;
    for (const [, groupEvents] of groups) {
        if (groupEvents.length < 2) continue;

        const sorted = groupEvents.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const stackResult = await upsertEventStack(
            venueId,
            groupEvents[0].title,
            sorted.length,
            sorted[0].date,
            sorted[sorted.length - 1].date
        );
        if (!isSuccess(stackResult)) continue;

        const eventIds = groupEvents.map((e) => e.id);
        await assignStackToEvents(eventIds, stackResult.data.id);
        stackCount++;
    }

    return stackCount;
}
