// app/api/view-items/route.ts
// @deprecated 이 경로는 /api/display-entries로 마이그레이션됩니다.
// 새 코드에서는 /api/display-entries를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleGetDisplayEntries, handleCreateDisplayEntry } from '@/lib/api/handlers';

export const GET = withAuth(async (request, context) => {
    return handleGetDisplayEntries(request, context);
});

export const POST = withAuth(async (request, context) => {
    return handleCreateDisplayEntry(request, context);
});
