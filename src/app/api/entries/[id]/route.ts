// app/api/entries/[id]/route.ts
// ContentEntry API - 새 경로 (기존: /api/components/[id])
import { withAuth } from '@/lib/api';
import { handleDeleteEntry, handleGetEntry, handleUpdateEntry } from '@/lib/api/handlers';

export const GET = withAuth<{ id: string }>(async (_request, context) => {
    return handleGetEntry(context, context.params.id);
});

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateEntry(request, context, context.params.id);
});

export const DELETE = withAuth<{ id: string }>(async (_request, context) => {
    return handleDeleteEntry(context, context.params.id);
});
