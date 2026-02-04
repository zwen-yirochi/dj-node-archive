// app/api/entries/reorder/route.ts
// ContentEntry API - 새 경로 (기존: /api/components/reorder)
import { withAuth } from '@/lib/api';
import { handleReorderEntries } from '@/lib/api/handlers';

export const PATCH = withAuth(async (request, context) => {
    return handleReorderEntries(request, context);
});
