// app/api/entries/max-display-order/route.ts
// 최대 display_order 조회
import { withAuth } from '@/lib/api';
import { handleGetMaxDisplayOrder } from '@/lib/api/handlers';

export const GET = withAuth(async (request, context) => {
    return handleGetMaxDisplayOrder(request, context);
});
