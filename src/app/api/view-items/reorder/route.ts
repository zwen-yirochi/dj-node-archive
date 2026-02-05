// app/api/view-items/reorder/route.ts
// @deprecated 이 경로는 /api/display-entries/reorder로 마이그레이션됩니다.
// 새 코드에서는 /api/display-entries/reorder를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleReorderDisplayEntries } from '@/lib/api/handlers';

export const PATCH = withAuth(async (request, context) => {
    return handleReorderDisplayEntries(request, context);
});
