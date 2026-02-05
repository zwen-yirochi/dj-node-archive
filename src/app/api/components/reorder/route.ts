// app/api/components/reorder/route.ts
// @deprecated 이 경로는 /api/entries/reorder로 마이그레이션됩니다.
// 새 코드에서는 /api/entries/reorder를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleReorderEntries } from '@/lib/api/handlers';

export const PATCH = withAuth(async (request, context) => {
    return handleReorderEntries(request, context);
});
