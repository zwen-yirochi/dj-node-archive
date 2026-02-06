// app/api/entries/reorder-display/route.ts
// Page 내 Entry 순서 변경 (display_order)
import { withAuth } from '@/lib/api';
import { handleReorderDisplayEntries } from '@/lib/api/handlers';

export const PATCH = withAuth(async (request, context) => {
    return handleReorderDisplayEntries(request, context);
});
