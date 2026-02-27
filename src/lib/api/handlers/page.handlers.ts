// lib/api/handlers/page.handlers.ts
import type { AuthContext } from '@/lib/api';
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    successResponse,
} from '@/lib/api';
import { verifyPageOwnership } from '@/lib/api';
import { updatePage } from '@/lib/db/queries/page.queries';
import { isSuccess } from '@/types/result';

/**
 * PATCH /api/pages/[id]
 * 페이지 업데이트 (테마, 공개 여부)
 */
export async function handleUpdatePage(
    request: Request,
    { user, params }: AuthContext & { params: { id: string } }
) {
    const { id } = params;

    // 1. Verify ownership
    const ownership = await verifyPageOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
    }

    // 2. Parse
    const body = await request.json();
    const { theme, is_public } = body;

    // 3. Database
    const result = await updatePage(id, { theme, is_public });
    if (!isSuccess(result)) return internalErrorResponse(result.error.message);

    // 4. Response
    return successResponse(result.data);
}
