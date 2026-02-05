// app/api/components/[id]/route.ts
// @deprecated 이 경로는 /api/entries/[id]로 마이그레이션됩니다.
// 새 코드에서는 /api/entries/[id]를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleUpdateEntry, handleDeleteEntry } from '@/lib/api/handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateEntry(request, context, context.params.id);
});

export const DELETE = withAuth<{ id: string }>(async (_request, context) => {
    return handleDeleteEntry(context, context.params.id);
});
