// lib/api/handlers/import.handlers.ts
// Import 관련 핸들러 (7-step 패턴)

import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

import type { Event as DBEvent } from '@/types/database';
import type { PreviewEventItem, VenueImportPreview, VenueImportResult } from '@/types/ra';
import type {
    ArtistImportPreview,
    ArtistImportResult,
    SingleEventImportResult,
} from '@/types/ra-import';
import { isSuccess } from '@/types/result';
import { verifyPageOwnership } from '@/lib/api/ownership';
import {
    internalErrorResponse,
    successResponse,
    zodValidationErrorResponse,
} from '@/lib/api/responses';
import type { AuthContext } from '@/lib/api/withAuth';
import { createEntry, ensureUniqueSlug, getMaxPosition } from '@/lib/db/queries/entry.queries';
import {
    assignStackToEvents,
    refreshStackSummary,
    upsertEventStack,
} from '@/lib/db/queries/event-stack.queries';
import {
    countSystemImportsInWindow,
    countUserEventImportsInWindow,
    countUserImportsInWindow,
    createImportedEntries,
    createImportedEvents,
    createImportedVenue,
    createImportLog,
    findArtistMigration,
    findEntryByEventReference,
    findEventByRAId,
    findVenueByRAUrl,
} from '@/lib/db/queries/import.queries';
import { findUserByAuthId } from '@/lib/db/queries/user.queries';
import { mapRAEventToDbInput, mapRAVenueToDbInput } from '@/lib/mappers';
import {
    fetchAllRAArtistEvents,
    fetchAllRAVenueEvents,
    fetchRAArtistEvents,
    fetchRAEvent,
    fetchRAVenueEvents,
    parseRAArtistUrl,
    parseRAEventUrl,
    parseRAVenueUrl,
} from '@/lib/services/ra.service';
import { generateSlug } from '@/lib/utils/slug';
import {
    artistImportConfirmSchema,
    artistImportPreviewSchema,
    singleEventImportSchema,
    venueImportConfirmSchema,
    venueImportPreviewSchema,
} from '@/lib/validations/import.schemas';

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
 * RA 이미지 URL → Supabase Storage에 복사, 새 URL 배열 반환
 * 실패한 이미지는 건너뛰고 성공한 것만 반환
 */
async function copyImagesToStorage(imageUrls: string[], userId: string): Promise<string[]> {
    if (imageUrls.length === 0) return [];

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const results: string[] = [];

    for (const url of imageUrls) {
        try {
            const response = await fetch(url);
            if (!response.ok) continue;

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const buffer = await response.arrayBuffer();

            const ext = contentType.includes('png')
                ? 'png'
                : contentType.includes('webp')
                  ? 'webp'
                  : 'jpg';
            const fileName = `${userId}/ra-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { error } = await supabase.storage
                .from('posters')
                .upload(fileName, buffer, { contentType, upsert: false });

            if (error) {
                console.error('[RA Import] Storage upload failed:', error.message, url);
                continue;
            }

            const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
            results.push(urlData.publicUrl);
        } catch (err) {
            console.error('[RA Import] Image copy failed:', url, err);
        }
    }

    return results;
}

/**
 * DB event → entry.data 전체 데이터 (참조형이지만 전체 데이터도 저장하는 Option B 패턴)
 */
function buildEntryDataFromEvent(eventId: string, dbEvent: DBEvent): Record<string, unknown> {
    return {
        event_id: eventId,
        title: dbEvent.title,
        date: dbEvent.date,
        venue: dbEvent.venue,
        lineup: dbEvent.lineup,
        image_urls: (dbEvent.data as Record<string, unknown>)?.poster_urls,
        description: (dbEvent.data as Record<string, unknown>)?.description,
        links: (dbEvent.data as Record<string, unknown>)?.links,
    };
}

/**
 * RA event listing → entry.data 전체 데이터 (DB event 없이 RA 데이터에서 직접 생성)
 */
function buildEntryDataFromRAEvent(
    eventId: string,
    raEvent: {
        title: string;
        date: string;
        description?: string | null;
        imageUrls?: string[];
        venue?: { name: string } | null;
        artists: { name: string }[];
    }
): Record<string, unknown> {
    return {
        event_id: eventId,
        title: raEvent.title,
        date: raEvent.date,
        venue: { name: raEvent.venue?.name ?? 'Unknown Venue' },
        lineup: raEvent.artists.map((a) => ({ name: a.name })),
        image_urls: raEvent.imageUrls?.length ? raEvent.imageUrls : undefined,
        description: raEvent.description || undefined,
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

// ============================================
// Artist Import Handlers
// ============================================

/**
 * POST /api/import/artist/preview
 * RA 아티스트 URL → 미리보기 데이터 (DB 저장 없음)
 */
export async function handleArtistImportPreview(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = artistImportPreviewSchema.safeParse(body);
    if (!parsed.success) return zodValidationErrorResponse(parsed.error);
    const { ra_url } = parsed.data;

    const urlResult = parseRAArtistUrl(ra_url);
    if (!urlResult.success) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: urlResult.error.message },
            },
            { status: 400 }
        );
    }
    const { artistSlug } = urlResult.data;

    // 3. Verify — user lookup + migration check
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = userResult.data.id;

    const migrationResult = await findArtistMigration(userId);
    if (!isSuccess(migrationResult)) return internalErrorResponse(migrationResult.error.message);
    if (migrationResult.data) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'CONFLICT', message: 'Artist migration already completed.' },
            },
            { status: 409 }
        );
    }

    // 4. RA API 호출
    const raResult = await fetchRAArtistEvents(artistSlug);
    if (!raResult.success) {
        return NextResponse.json(
            { success: false, error: { code: 'NETWORK_ERROR', message: raResult.error.message } },
            { status: 502 }
        );
    }

    const { artist, events, totalResults } = raResult.data;
    if (!artist) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Artist not found on RA.' } },
            { status: 404 }
        );
    }

    // 5. Preview 변환
    const preview: ArtistImportPreview = {
        artist: { name: artist.name, eventCount: totalResults },
        sampleEvents: events.slice(0, 10).map(toPreviewEvent),
    };

    // 6. 응답
    return successResponse(preview);
}

/**
 * POST /api/import/artist/confirm
 * RA 아티스트 전체 이벤트 → events + entries 생성
 */
export async function handleArtistImportConfirm(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = artistImportConfirmSchema.safeParse(body);
    if (!parsed.success) return zodValidationErrorResponse(parsed.error);
    const { ra_url, page_id } = parsed.data;

    const urlResult = parseRAArtistUrl(ra_url);
    if (!urlResult.success) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: urlResult.error.message },
            },
            { status: 400 }
        );
    }
    const { artistSlug } = urlResult.data;

    // 3. Verify — user, page ownership, migration check, system rate limit
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = userResult.data.id;

    const ownership = await verifyPageOwnership(page_id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? NextResponse.json(
                  { success: false, error: { code: 'NOT_FOUND', message: 'Page not found.' } },
                  { status: 404 }
              )
            : NextResponse.json(
                  { success: false, error: { code: 'FORBIDDEN', message: 'Not your page.' } },
                  { status: 403 }
              );
    }

    const migrationResult = await findArtistMigration(userId);
    if (!isSuccess(migrationResult)) return internalErrorResponse(migrationResult.error.message);
    if (migrationResult.data) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'CONFLICT', message: 'Artist migration already completed.' },
            },
            { status: 409 }
        );
    }

    // System rate limit
    const systemRateLimit = await checkRateLimit(userId);
    if (!systemRateLimit.allowed) {
        return NextResponse.json(
            { success: false, error: { code: 'RATE_LIMIT', message: systemRateLimit.message } },
            { status: 429 }
        );
    }

    // 4. RA API 전체 수집
    const raResult = await fetchAllRAArtistEvents(artistSlug);
    if (!raResult.success) {
        return NextResponse.json(
            { success: false, error: { code: 'NETWORK_ERROR', message: raResult.error.message } },
            { status: 502 }
        );
    }

    const { artist, events: raEvents } = raResult.data;
    if (!artist) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Artist not found on RA.' } },
            { status: 404 }
        );
    }

    if (raEvents.length === 0) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'NOT_FOUND', message: 'No events found for this artist.' },
            },
            { status: 404 }
        );
    }

    // 5. Get current max position
    const maxPosResult = await getMaxPosition(page_id);
    if (!isSuccess(maxPosResult)) return internalErrorResponse(maxPosResult.error.message);
    let currentPosition = maxPosResult.data;

    // 6. Process events — sort by date (oldest first), then batch
    const sortedEvents = [...raEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const successList: string[] = [];
    const failedList: { title: string; reason: string }[] = [];

    // Phase 1: Create events in DB (batch insert new ones, skip duplicates)
    const newEventInputs: ReturnType<typeof mapRAEventToDbInput>[] = [];
    const existingEventMap = new Map<string, string>(); // raEventId → dbEventId

    for (const raEvent of sortedEvents) {
        const existing = await findEventByRAId(raEvent.id);
        if (isSuccess(existing) && existing.data) {
            existingEventMap.set(raEvent.id, existing.data.id);
        } else {
            const eventInput = mapRAEventToDbInput(
                raEvent,
                '',
                raEvent.venue?.name ?? 'Unknown Venue',
                userId
            );
            // Override venue to text-only (no venue row creation)
            eventInput.venue = { name: raEvent.venue?.name ?? 'Unknown Venue' };
            newEventInputs.push(eventInput);
        }
    }

    // Batch insert new events
    if (newEventInputs.length > 0) {
        const batchResult = await createImportedEvents(newEventInputs);
        if (isSuccess(batchResult)) {
            for (const dbEvent of batchResult.data) {
                const raId = (dbEvent.data as Record<string, unknown>)?.ra_event_id as string;
                if (raId) existingEventMap.set(raId, dbEvent.id);
            }
        }
    }

    // Phase 2: Create entries in batch
    const entryInputs: Parameters<typeof createImportedEntries>[0] = [];

    for (const raEvent of sortedEvents) {
        const eventId = existingEventMap.get(raEvent.id);
        if (!eventId) {
            failedList.push({ title: raEvent.title, reason: 'Event creation failed' });
            continue;
        }

        // Check if entry already exists for this event
        const existingEntry = await findEntryByEventReference(page_id, eventId);
        if (isSuccess(existingEntry) && existingEntry.data) {
            failedList.push({ title: raEvent.title, reason: 'duplicate' });
            continue;
        }

        currentPosition += 1;
        const entryId = uuidv4();
        const rawSlug = generateSlug(raEvent.title || 'event');
        const slug = await ensureUniqueSlug(rawSlug, page_id);

        // Copy images to Supabase Storage
        const storedImageUrls = await copyImagesToStorage(raEvent.imageUrls, userId);
        const entryData = buildEntryDataFromRAEvent(eventId, {
            ...raEvent,
            imageUrls: storedImageUrls,
        });
        entryData.ra_source_url = raEvent.contentUrl
            ? `https://ra.co${raEvent.contentUrl}`
            : undefined;

        entryInputs.push({
            id: entryId,
            page_id,
            type: 'event' as const,
            position: currentPosition,
            reference_id: eventId,
            data: entryData,
            slug,
        });

        successList.push(raEvent.title);
    }

    // Batch insert entries (in chunks of 50 to avoid payload limits)
    const BATCH_SIZE = 50;
    for (let i = 0; i < entryInputs.length; i += BATCH_SIZE) {
        const batch = entryInputs.slice(i, i + BATCH_SIZE);
        const batchResult = await createImportedEntries(batch);
        if (!isSuccess(batchResult)) {
            for (const entry of batch) {
                const idx = successList.indexOf(
                    sortedEvents.find((e) => existingEventMap.get(e.id) === entry.reference_id)
                        ?.title ?? ''
                );
                if (idx >= 0) {
                    const title = successList.splice(idx, 1)[0];
                    failedList.push({ title, reason: 'Entry batch creation failed' });
                }
            }
        }
    }

    // 7. Write import log
    const status = failedList.length === 0 ? 'completed' : 'partial';
    await createImportLog({
        user_id: userId,
        import_type: 'artist',
        ra_url,
        event_count: successList.length,
        status,
        metadata: {
            artist_name: artist.name,
            total: sortedEvents.length,
            success: successList.length,
            failed: failedList.length,
            failed_events: failedList,
        },
    });

    // 8. Response
    const result: ArtistImportResult = {
        artist: { name: artist.name },
        totalEvents: sortedEvents.length,
        successCount: successList.length,
        failedCount: failedList.length,
        failedEvents: failedList,
    };

    return successResponse(result, 201);
}

/**
 * GET /api/import/artist/status
 * 현재 유저의 아티스트 마이그레이션 상태 조회
 */
export async function handleArtistMigrationStatus(_request: Request, { user }: AuthContext) {
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }

    const migrationResult = await findArtistMigration(userResult.data.id);
    if (!isSuccess(migrationResult)) return internalErrorResponse(migrationResult.error.message);

    if (!migrationResult.data) {
        return successResponse({ completed: false });
    }

    const metadata = migrationResult.data.metadata as Record<string, unknown>;
    return successResponse({
        completed: true,
        artistName: metadata?.artist_name,
        eventCount: migrationResult.data.event_count,
        completedAt: migrationResult.data.created_at,
    });
}

// ============================================
// Single Event Import Handler
// ============================================

/**
 * POST /api/import/event
 * RA 이벤트 URL → event + entry 생성
 */
export async function handleSingleEventImport(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = singleEventImportSchema.safeParse(body);
    if (!parsed.success) return zodValidationErrorResponse(parsed.error);
    const { ra_url, page_id } = parsed.data;

    const urlResult = parseRAEventUrl(ra_url);
    if (!urlResult.success) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: urlResult.error.message },
            },
            { status: 400 }
        );
    }
    const { eventId: raEventId } = urlResult.data;

    // 3. Verify — user, page ownership, rate limits
    const userResult = await findUserByAuthId(user.id);
    if (!isSuccess(userResult) || !userResult.data) {
        return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }
    const userId = userResult.data.id;

    const ownership = await verifyPageOwnership(page_id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? NextResponse.json(
                  { success: false, error: { code: 'NOT_FOUND', message: 'Page not found.' } },
                  { status: 404 }
              )
            : NextResponse.json(
                  { success: false, error: { code: 'FORBIDDEN', message: 'Not your page.' } },
                  { status: 403 }
              );
    }

    // User-level event rate limit
    const eventRateCount = await countUserEventImportsInWindow(userId, RATE_LIMIT_WINDOW_HOURS);
    if (!isSuccess(eventRateCount)) return internalErrorResponse('Rate limit check failed.');
    if (eventRateCount.data >= USER_RATE_LIMIT) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded, try again later.' },
            },
            { status: 429 }
        );
    }

    // System-wide rate limit
    const systemRateLimit = await checkRateLimit(userId);
    if (!systemRateLimit.allowed) {
        return NextResponse.json(
            { success: false, error: { code: 'RATE_LIMIT', message: systemRateLimit.message } },
            { status: 429 }
        );
    }

    // 4. Check dedup
    const existingEvent = await findEventByRAId(raEventId);
    if (!isSuccess(existingEvent)) return internalErrorResponse(existingEvent.error.message);

    let dbEventId: string;
    let eventTitle: string;
    let eventDate: string;
    let eventVenueName: string;
    let entryData: Record<string, unknown>;

    if (existingEvent.data) {
        dbEventId = existingEvent.data.id;
        eventTitle = existingEvent.data.title;
        eventDate = existingEvent.data.date;
        eventVenueName = existingEvent.data.venue.name;
        entryData = buildEntryDataFromEvent(dbEventId, existingEvent.data);

        // 기존 event에 이미지가 없으면 RA에서 가져와서 Storage에 복사
        const existingImages = (entryData.image_urls as string[]) || [];
        if (existingImages.length === 0) {
            const raResult = await fetchRAEvent(raEventId);
            if (raResult.success && raResult.data && raResult.data.imageUrls.length > 0) {
                const storedUrls = await copyImagesToStorage(raResult.data.imageUrls, userId);
                if (storedUrls.length > 0) {
                    entryData.image_urls = storedUrls;
                }
            }
        }
        entryData.ra_source_url = ra_url;
    } else {
        // 5. Fetch from RA
        const raResult = await fetchRAEvent(raEventId);
        if (!raResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'NETWORK_ERROR', message: raResult.error.message },
                },
                { status: 502 }
            );
        }
        if (!raResult.data) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Event not found on RA.' } },
                { status: 404 }
            );
        }

        const raEvent = raResult.data;
        const eventInput = mapRAEventToDbInput(
            raEvent,
            '',
            raEvent.venue?.name ?? 'Unknown Venue',
            userId
        );
        eventInput.venue = { name: raEvent.venue?.name ?? 'Unknown Venue' };

        const createResult = await createImportedEvents([eventInput]);
        if (!isSuccess(createResult) || createResult.data.length === 0) {
            return internalErrorResponse('Event creation failed.');
        }

        dbEventId = createResult.data[0].id;
        eventTitle = raEvent.title;
        eventDate = raEvent.date;
        eventVenueName = raEvent.venue?.name ?? '';

        // Copy images to Supabase Storage
        const storedImageUrls = await copyImagesToStorage(raEvent.imageUrls, userId);
        entryData = buildEntryDataFromRAEvent(dbEventId, {
            ...raEvent,
            imageUrls: storedImageUrls,
        });
        entryData.ra_source_url = ra_url;
    }

    // 6. Check if entry already exists
    const existingEntry = await findEntryByEventReference(page_id, dbEventId);
    if (!isSuccess(existingEntry)) return internalErrorResponse(existingEntry.error.message);
    if (existingEntry.data) {
        return NextResponse.json(
            {
                success: false,
                error: { code: 'CONFLICT', message: 'This event is already in your archive.' },
            },
            { status: 409 }
        );
    }

    // 7. Create entry
    const maxPosResult = await getMaxPosition(page_id);
    if (!isSuccess(maxPosResult)) return internalErrorResponse(maxPosResult.error.message);

    const entryId = uuidv4();
    const rawSlug = generateSlug(eventTitle || 'event');
    const slug = await ensureUniqueSlug(rawSlug, page_id);

    const entryResult = await createEntry(entryId, {
        page_id,
        type: 'event',
        position: maxPosResult.data + 1,
        reference_id: dbEventId,
        data: entryData as unknown as import('@/types/database').EntryData,
        slug,
    });

    if (!isSuccess(entryResult)) return internalErrorResponse(entryResult.error.message);

    // 8. Log
    await createImportLog({
        user_id: userId,
        import_type: 'event',
        ra_url,
        event_count: 1,
    });

    // 9. Response
    const result: SingleEventImportResult = {
        entry: { id: entryId, slug },
        event: { title: eventTitle, date: eventDate, venue: eventVenueName },
    };

    return successResponse(result, 201);
}
