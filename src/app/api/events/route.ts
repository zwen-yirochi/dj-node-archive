// app/api/events/route.ts
import { createEvent, findEventsByUserId } from '@/lib/db/queries/event.queries';
import { isSuccess } from '@/types/result';
import {
    withAuth,
    withOptionalAuth,
    successResponse,
    validationErrorResponse,
    internalErrorResponse,
} from '@/lib/api';

// POST /api/events - 이벤트 생성
export const POST = withAuth(async (request, { user }) => {
    const body = await request.json();
    const { venue_ref_id, title, date, data } = body;

    // 필수 필드 검증
    if (!venue_ref_id) {
        return validationErrorResponse('베뉴');
    }

    if (!date) {
        return validationErrorResponse('날짜');
    }

    const result = await createEvent({
        user_id: user.id,
        venue_ref_id,
        title: title?.trim() || undefined,
        date,
        data: data || {},
    });

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data, 201);
});

// GET /api/events - 이벤트 목록 조회
// user_id 파라미터가 있으면 해당 유저의 이벤트를 public 조회
// 없으면 현재 인증된 유저의 이벤트 조회
export const GET = withOptionalAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // user_id가 없으면 현재 인증된 유저의 이벤트 조회
    const targetUserId = userId ?? user?.id;

    if (!targetUserId) {
        return validationErrorResponse('user_id 또는 인증');
    }

    const result = await findEventsByUserId(targetUserId, limit);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
});
