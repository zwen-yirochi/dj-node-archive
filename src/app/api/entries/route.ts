// app/api/entries/route.ts
// ContentEntry API - 새 경로 (기존: /api/components)
import { withAuth } from '@/lib/api';
import { handleCreateEntry } from '@/lib/api/handlers';

export const POST = withAuth(async (request, context) => {
    return handleCreateEntry(request, context);
});
