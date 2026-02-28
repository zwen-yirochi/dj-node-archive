// app/api/pages/[id]/route.ts
import { withAuth } from '@/lib/api';
import { handleUpdatePage } from '@/lib/api/handlers/page.handlers';

// PATCH /api/pages/[id] - 페이지 업데이트 (테마 등)
export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdatePage(request, context);
});
