// app/api/entries/[id]/route.ts
// ContentEntry API - 새 경로 (기존: /api/components/[id])
import { withAuth } from '@/lib/api';
import { handleUpdateEntry, handleDeleteEntry } from '@/lib/api/handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateEntry(request, context, context.params.id);
});

export const DELETE = withAuth<{ id: string }>(async (_request, context) => {
    return handleDeleteEntry(context, context.params.id);
});
