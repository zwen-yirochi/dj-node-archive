// lib/api/handlers/entry.handlers.ts
// ContentEntry API 핸들러
import {
    createEntry,
    getMaxPosition,
    updateEntry,
    deleteEntry,
    updateEntryPositions,
} from '@/lib/db/queries/entry.queries';
import { mapEntryToDatabase } from '@/lib/mappers';
import { isSuccess } from '@/types/result';
import type { ContentEntry } from '@/types/domain';
import {
    verifyPageOwnership,
    verifyEntryOwnership,
    verifyEntriesOwnership,
    successResponse,
    forbiddenResponse,
    notFoundResponse,
    validationErrorResponse,
    internalErrorResponse,
} from '@/lib/api';
import type { AuthContext } from '@/lib/api';

/**
 * POST /api/entries (또는 /api/components)
 * Entry 생성
 */
export async function handleCreateEntry(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const { pageId, entry } = body as { pageId: string; entry: ContentEntry };

    if (!pageId || !entry) {
        return validationErrorResponse('pageId와 entry');
    }

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
    const dbEntry = mapEntryToDatabase(entry, newPosition);

    const result = await createEntry(entry.id, {
        page_id: pageId,
        type: dbEntry.type,
        position: dbEntry.position,
        data: dbEntry.data,
    });

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data, 201);
}

/**
 * PATCH /api/entries/[id] (또는 /api/components/[id])
 * Entry 수정
 */
export async function handleUpdateEntry(request: Request, { user }: AuthContext, id: string) {
    // 소유권 검증
    const ownership = await verifyEntryOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('엔트리') : forbiddenResponse();
    }

    const body = await request.json();
    const { entry } = body as { entry: ContentEntry };

    if (!entry) {
        return validationErrorResponse('entry');
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

interface ReorderItem {
    id: string;
    position: number;
}

/**
 * PATCH /api/entries/reorder (또는 /api/components/reorder)
 * Entry 순서 변경
 */
export async function handleReorderEntries(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const { updates } = body as { updates: ReorderItem[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return validationErrorResponse('updates 배열');
    }

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
