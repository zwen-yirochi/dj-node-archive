// app/api/editor/data/route.ts
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { isSuccess } from '@/types/result';
import { withAuth, successResponse, notFoundResponse, internalErrorResponse } from '@/lib/api';

export const GET = withAuth(async (_request, { user }) => {
    const result = await getEditorDataByAuthUserId(user.id);

    if (!isSuccess(result)) {
        return result.error.code === 'NOT_FOUND'
            ? notFoundResponse('에디터 데이터')
            : internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
});
