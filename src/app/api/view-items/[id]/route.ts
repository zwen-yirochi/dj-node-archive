// app/api/view-items/[id]/route.ts
// @deprecated 이 경로는 /api/display-entries/[id]로 마이그레이션됩니다.
// 새 코드에서는 /api/display-entries/[id]를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleUpdateDisplayEntry, handleDeleteDisplayEntry } from '@/lib/api/handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateDisplayEntry(request, context, context.params.id);
});

export const DELETE = withAuth<{ id: string }>(async (_request, context) => {
    return handleDeleteDisplayEntry(context, context.params.id);
});
