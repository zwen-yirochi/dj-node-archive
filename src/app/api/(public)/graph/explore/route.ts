// app/api/(public)/graph/explore/route.ts
// Public GET endpoint for local graph exploration
import { isSuccess } from '@/types/result';
import { internalErrorResponse, successResponse, validationErrorResponse } from '@/lib/api';
import { getLocalGraph } from '@/lib/db/queries/graph.queries';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const depth = Math.min(Number(searchParams.get('depth') || 2), 3);

    if (!nodeId) {
        return validationErrorResponse('nodeId');
    }

    const result = await getLocalGraph(nodeId, depth);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
}
