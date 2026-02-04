// app/api/display-entries/reorder/route.ts
// DisplayEntry API - 새 경로 (기존: /api/view-items/reorder)
import { withAuth } from '@/lib/api';
import { handleReorderDisplayEntries } from '@/lib/api/handlers';

export const PATCH = withAuth(async (request, context) => {
    return handleReorderDisplayEntries(request, context);
});
