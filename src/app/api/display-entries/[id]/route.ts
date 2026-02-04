// app/api/display-entries/[id]/route.ts
// DisplayEntry API - 새 경로 (기존: /api/view-items/[id])
import { withAuth } from '@/lib/api';
import { handleUpdateDisplayEntry, handleDeleteDisplayEntry } from '@/lib/api/handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateDisplayEntry(request, context, context.params.id);
});

export const DELETE = withAuth<{ id: string }>(async (_request, context) => {
    return handleDeleteDisplayEntry(context, context.params.id);
});
