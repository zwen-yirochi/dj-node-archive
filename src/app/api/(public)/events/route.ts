// app/api/events/route.ts
import {
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
    withAuth,
    withOptionalAuth,
} from '@/lib/api';
import { createEvent, findEventsByUserId } from '@/lib/db/queries/event.queries';
import { isSuccess } from '@/types/result';

// POST /api/events - 이벤트 생성
export const POST = withAuth(async (request) => {
    const body = await request.json();
    const { title, slug, date, venue, lineup, data, is_public, created_by } = body;

    // 필수 필드 검증
    if (!venue) {
        return validationErrorResponse('베뉴');
    }

    if (!date) {
        return validationErrorResponse('날짜');
    }
    const result = await createEvent({
        title: title?.trim() || undefined,
        slug,
        date,
        venue,
        lineup,
        data: data || {},
        is_public,
        created_by,
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
