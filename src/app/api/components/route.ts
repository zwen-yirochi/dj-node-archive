// app/api/components/route.ts
// @deprecated 이 경로는 /api/entries로 마이그레이션됩니다.
// 새 코드에서는 /api/entries를 사용해주세요.
import { withAuth } from '@/lib/api';
import { handleCreateEntry } from '@/lib/api/handlers';

export const POST = withAuth(async (request, context) => {
    // TODO: deprecated 경고 로깅 추가 예정
    return handleCreateEntry(request, context);
});
