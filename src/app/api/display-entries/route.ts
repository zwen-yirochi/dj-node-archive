// app/api/display-entries/route.ts
// DisplayEntry API - 새 경로 (기존: /api/view-items)
import { withAuth } from '@/lib/api';
import { handleGetDisplayEntries, handleCreateDisplayEntry } from '@/lib/api/handlers';

export const GET = withAuth(async (request, context) => {
    return handleGetDisplayEntries(request, context);
});

export const POST = withAuth(async (request, context) => {
    return handleCreateDisplayEntry(request, context);
});
