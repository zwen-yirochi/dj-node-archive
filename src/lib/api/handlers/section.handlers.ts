import { isSuccess } from '@/types/result';
import {
    forbiddenResponse,
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/api/responses';
import type { AuthContext } from '@/lib/api/withAuth';
import { getEntriesByPageId } from '@/lib/db/queries/entry.queries';
import { findPageByUserId, updateSections } from '@/lib/db/queries/page.queries';
import { updateSectionsRequestSchema } from '@/lib/validations/section.schemas';

export async function handleUpdateSections(
    request: Request,
    { user }: AuthContext,
    pageId: string
) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = updateSectionsRequestSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid sections');
    }

    // 3. Verify page ownership
    const pageResult = await findPageByUserId(user.id);
    if (!isSuccess(pageResult) || !pageResult.data || pageResult.data.id !== pageId) {
        return forbiddenResponse();
    }

    // 4. Verify entryIds ownership
    const allEntryIds = parsed.data.sections.flatMap((s) => s.entryIds);
    if (allEntryIds.length > 0) {
        const entriesResult = await getEntriesByPageId(pageId);
        if (!isSuccess(entriesResult)) {
            return internalErrorResponse('Failed to verify entry ownership');
        }
        const validIds = new Set(entriesResult.data.map((e) => e.id));
        const invalidIds = allEntryIds.filter((id) => !validIds.has(id));
        if (invalidIds.length > 0) {
            return validationErrorResponse(`Invalid entryIds: ${invalidIds.join(', ')}`);
        }
    }

    // 5. Database
    const result = await updateSections(pageId, parsed.data.sections);
    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    // 6. Response
    return successResponse(result.data);
}
