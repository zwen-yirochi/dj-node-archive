// lib/api/handlers/display-entry.handlers.ts
// DisplayEntry API 핸들러
import {
    getDisplayEntriesByPageId,
    addDisplayEntry,
    getMaxDisplayEntryOrderIndex,
    removeDisplayEntry,
    setDisplayEntryVisibility,
    updateDisplayEntryOrder,
} from '@/lib/db/queries/display-entry.queries';
import { isSuccess } from '@/types/result';
import {
    verifyPageOwnership,
    verifyEntryOwnership,
    verifyDisplayEntryOwnership,
    verifyDisplayEntriesOwnership,
    successResponse,
    forbiddenResponse,
    notFoundResponse,
    validationErrorResponse,
    internalErrorResponse,
} from '@/lib/api';
import type { AuthContext } from '@/lib/api';

/**
 * GET /api/display-entries (또는 /api/view-items)
 * DisplayEntry 목록 조회
 */
export async function handleGetDisplayEntries(request: Request, { user }: AuthContext) {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
        return validationErrorResponse('pageId');
    }

    // 페이지 소유권 검증
    const ownership = await verifyPageOwnership(pageId, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
    }

    const result = await getDisplayEntriesByPageId(pageId);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
}

/**
 * POST /api/display-entries (또는 /api/view-items)
 * DisplayEntry 추가
 */
export async function handleCreateDisplayEntry(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const { entryId, orderIndex } = body as {
        entryId: string;
        orderIndex?: number;
    };

    if (!entryId) {
        return validationErrorResponse('entryId');
    }

    // 엔트리 소유권 검증 (entry → page → user)
    const ownership = await verifyEntryOwnership(entryId, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    // orderIndex가 제공되지 않으면 자동 계산
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
        const maxResult = await getMaxDisplayEntryOrderIndex(ownership.pageId);
        if (!isSuccess(maxResult)) {
            return internalErrorResponse(maxResult.error.message);
        }
        finalOrderIndex = maxResult.data + 1;
    }

    const result = await addDisplayEntry(entryId, finalOrderIndex);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data, 201);
}

/**
 * PATCH /api/display-entries/[id] (또는 /api/view-items/[id])
 * DisplayEntry 수정 (visibility)
 */
export async function handleUpdateDisplayEntry(
    request: Request,
    { user }: AuthContext,
    id: string
) {
    // 소유권 검증
    const ownership = await verifyDisplayEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? notFoundResponse('DisplayEntry')
            : forbiddenResponse();
    }

    const body = await request.json();
    const { isVisible } = body as { isVisible: boolean };

    if (typeof isVisible !== 'boolean') {
        return validationErrorResponse('isVisible');
    }

    const result = await setDisplayEntryVisibility(id, isVisible);

    if (!isSuccess(result)) {
        return result.error.code === 'NOT_FOUND'
            ? notFoundResponse('DisplayEntry')
            : internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
}

/**
 * DELETE /api/display-entries/[id] (또는 /api/view-items/[id])
 * DisplayEntry 삭제
 */
export async function handleDeleteDisplayEntry({ user }: AuthContext, id: string) {
    // 소유권 검증
    const ownership = await verifyDisplayEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? notFoundResponse('DisplayEntry')
            : forbiddenResponse();
    }

    const result = await removeDisplayEntry(id);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
}

interface ReorderItem {
    id: string;
    orderIndex: number;
}

/**
 * PATCH /api/display-entries/reorder (또는 /api/view-items/reorder)
 * DisplayEntry 순서 변경
 */
export async function handleReorderDisplayEntries(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const { updates } = body as { updates: ReorderItem[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return validationErrorResponse('updates 배열');
    }

    // 모든 DisplayEntry의 소유권 일괄 검증
    const displayEntryIds = updates.map((u) => u.id);
    const ownership = await verifyDisplayEntriesOwnership(displayEntryIds, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? notFoundResponse('DisplayEntry')
            : forbiddenResponse();
    }

    const result = await updateDisplayEntryOrder(updates);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
}
