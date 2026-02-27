// lib/api/handlers/entry.handlers.ts
// ContentEntry API 핸들러
import type { AuthContext } from '@/lib/api';
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    successResponse,
    verifyEntriesOwnership,
    verifyEntryOwnership,
    verifyPageOwnership,
    zodValidationErrorResponse,
} from '@/lib/api';
import {
    createEntry,
    deleteEntry,
    getEntryById,
    getMaxDisplayOrder,
    getMaxPosition,
    updateDisplayOrders,
    updateEntry,
    updateEntryPositions,
} from '@/lib/db/queries/entry.queries';
import { createEvent, generateEventSlug } from '@/lib/db/queries/event.queries';
import { findUserByAuthId } from '@/lib/db/queries/user.queries';
import { mapEntryToDatabase, mapEntryToDomain } from '@/lib/mappers';
import {
    createEntryRequestSchema,
    publishEventSchema,
    reorderDisplayEntriesRequestSchema,
    reorderEntriesRequestSchema,
    updateEntryRequestSchema,
} from '@/lib/validations/entry.schemas';
import { isSuccess } from '@/types/result';
import { ZodError } from 'zod';

/**
 * POST /api/entries (또는 /api/components)
 * Entry 생성
 *
 * publishOption === 'publish' 이고 type === 'event'인 경우:
 * 1. events 테이블에 이벤트 생성
 * 2. entries 테이블에 reference_id로 참조하는 엔트리 생성
 *
 * 그 외의 경우:
 * - entries.data에 직접 데이터 저장
 */
export async function handleCreateEntry(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const parsed = createEntryRequestSchema.safeParse(body);

    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }

    const { pageId, entry, publishOption } = parsed.data;

    // 페이지 소유권 검증
    const ownership = await verifyPageOwnership(pageId, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
    }

    // 최대 position 조회
    const maxPositionResult = await getMaxPosition(pageId);
    if (!isSuccess(maxPositionResult)) {
        return internalErrorResponse(maxPositionResult.error.message);
    }

    const newPosition = maxPositionResult.data + 1;
    let referenceId: string | null = null;

    // Publish 옵션이고 event 타입인 경우: events 테이블에 먼저 생성
    if (publishOption === 'publish' && entry.type === 'event') {
        // publish 시 이벤트 데이터 검증 — Zod 결과를 직접 사용하여 타입 안전성 확보
        const eventParsed = publishEventSchema.safeParse(entry);
        if (!eventParsed.success) {
            return zodValidationErrorResponse(eventParsed.error);
        }
        const eventData = eventParsed.data;

        // user.id는 auth.users.id이므로 users.id로 변환 필요
        const userResult = await findUserByAuthId(user.id);
        if (!isSuccess(userResult) || !userResult.data) {
            return internalErrorResponse('사용자 정보를 찾을 수 없습니다.');
        }
        const userId = userResult.data.id;

        const eventResult = await createEvent({
            title: eventData.title,
            slug: generateEventSlug(eventData.title, eventData.date),
            date: eventData.date,
            venue: eventData.venue || { name: '' },
            lineup: eventData.lineup || [],
            data: {
                poster_url: eventData.posterUrl,
                description: eventData.description,
                links: eventData.links,
            },
            is_public: true,
            created_by: userId,
        });

        if (!isSuccess(eventResult)) {
            return internalErrorResponse(eventResult.error.message);
        }

        referenceId = eventResult.data.id;
    }

    const dbEntry = mapEntryToDatabase(entry, newPosition);

    // Option B: 둘 다 유지 - entries.data에 전체 데이터, reference_id는 플래그
    const result = await createEntry(entry.id, {
        page_id: pageId,
        type: dbEntry.type,
        position: dbEntry.position,
        reference_id: referenceId,
        data: dbEntry.data, // 항상 전체 데이터 저장
    });

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse({ ...result.data, referenceId }, 201);
}

/**
 * GET /api/entries/[id]
 * Entry 단건 조회
 */
export async function handleGetEntry({ user }: AuthContext, id: string) {
    const ownership = await verifyEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const result = await getEntryById(id);
    if (!isSuccess(result)) {
        return result.error.code === 'NOT_FOUND'
            ? notFoundResponse('엔트리')
            : internalErrorResponse(result.error.message);
    }

    return successResponse(mapEntryToDomain(result.data));
}

/**
 * PATCH /api/entries/[id] (또는 /api/components/[id])
 * Entry 수정
 *
 * Body 옵션:
 * 1. { entry: ContentEntry } - 전체 엔트리 수정
 * 2. { isVisible: boolean } - visibility만 토글
 * 3. { displayOrder: number | null } - Page에 추가/제거
 * 4. { displayOrder: number | null, isVisible: boolean } - 둘 다 변경
 */
export async function handleUpdateEntry(request: Request, { user }: AuthContext, id: string) {
    // 소유권 검증
    const ownership = await verifyEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const body = await request.json();
    const parsed = updateEntryRequestSchema.safeParse(body);

    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }

    const { entry, isVisible, displayOrder } = parsed.data;

    // Case 1: displayOrder 및/또는 isVisible만 변경
    if (displayOrder !== undefined || typeof isVisible === 'boolean') {
        const updateData: { is_visible?: boolean; display_order?: number | null } = {};

        if (typeof isVisible === 'boolean') {
            updateData.is_visible = isVisible;
        }
        if (displayOrder !== undefined) {
            updateData.display_order = displayOrder;
        }

        const result = await updateEntry(id, updateData);

        if (!isSuccess(result)) {
            return result.error.code === 'NOT_FOUND'
                ? notFoundResponse('엔트리')
                : internalErrorResponse(result.error.message);
        }

        return successResponse(result.data);
    }

    // Case 2: 전체 엔트리 수정
    if (!entry) {
        return zodValidationErrorResponse(
            new ZodError([
                {
                    code: 'custom',
                    path: ['entry'],
                    message: 'entry, isVisible, 또는 displayOrder가 필요합니다',
                },
            ])
        );
    }

    // position은 유지하면서 type과 data만 업데이트
    const dbEntry = mapEntryToDatabase(entry, 0);

    const result = await updateEntry(id, {
        type: dbEntry.type,
        data: dbEntry.data,
    });

    if (!isSuccess(result)) {
        return result.error.code === 'NOT_FOUND'
            ? notFoundResponse('엔트리')
            : internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
}

/**
 * DELETE /api/entries/[id] (또는 /api/components/[id])
 * Entry 삭제
 */
export async function handleDeleteEntry({ user }: AuthContext, id: string) {
    // 소유권 검증
    const ownership = await verifyEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const result = await deleteEntry(id);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
}

/**
 * PATCH /api/entries/reorder
 * Entry 순서 변경 (Components 섹션 내)
 */
export async function handleReorderEntries(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const parsed = reorderEntriesRequestSchema.safeParse(body);

    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }

    const { updates } = parsed.data;

    // 모든 엔트리의 소유권 일괄 검증
    const entryIds = updates.map((u) => u.id);
    const ownership = await verifyEntriesOwnership(entryIds, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const result = await updateEntryPositions(updates);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
}

/**
 * PATCH /api/entries/reorder-display
 * Page 내 Entry 순서 변경 (display_order)
 */
export async function handleReorderDisplayEntries(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const parsed = reorderDisplayEntriesRequestSchema.safeParse(body);

    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
    }

    const { updates } = parsed.data;

    // 모든 엔트리의 소유권 일괄 검증
    const entryIds = updates.map((u) => u.id);
    const ownership = await verifyEntriesOwnership(entryIds, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const result = await updateDisplayOrders(
        updates.map((u) => ({ id: u.id, display_order: u.displayOrder }))
    );

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
}

/**
 * GET /api/entries/max-display-order?pageId=xxx
 * 최대 display_order 조회 (Page에 추가할 때 사용)
 */
export async function handleGetMaxDisplayOrder(request: Request, { user }: AuthContext) {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
        return zodValidationErrorResponse(
            new ZodError([
                {
                    code: 'custom',
                    path: ['pageId'],
                    message: 'pageId가 필요합니다',
                },
            ])
        );
    }

    // 페이지 소유권 검증
    const ownership = await verifyPageOwnership(pageId, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
    }

    const result = await getMaxDisplayOrder(pageId);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse({ maxDisplayOrder: result.data });
}
