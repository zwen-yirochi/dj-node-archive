// app/api/events/[id]/route.ts
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    successResponse,
    withAuth,
} from '@/lib/api';
import { deleteEvent, findEventById, updateEvent } from '@/lib/db/queries/event.queries';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/events/[id] - 이벤트 상세 조회 (public)
export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const result = await findEventById(id);

        if (!isSuccess(result)) {
            return result.error.code === 'NOT_FOUND'
                ? NextResponse.json(
                      {
                          success: false,
                          error: { code: 'NOT_FOUND', message: result.error.message },
                      },
                      { status: 404 }
                  )
                : NextResponse.json(
                      {
                          success: false,
                          error: { code: 'INTERNAL_ERROR', message: result.error.message },
                      },
                      { status: 500 }
                  );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('GET /api/events/[id] error:', err);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: '이벤트 조회 실패' } },
            { status: 500 }
        );
    }
}

// PATCH /api/events/[id] - 이벤트 수정
export const PATCH = withAuth<{ id: string }>(async (request, { user, params }) => {
    const { id } = params;

    const body = await request.json();
    const { venue, title, date, data } = body;

    // updateEvent 내부에서 소유권 검증
    const result = await updateEvent(id, user.id, {
        venue,
        title: title?.trim(),
        date,
        data,
    });

    if (!isSuccess(result)) {
        if (result.error.code === 'NOT_FOUND') {
            return notFoundResponse('이벤트');
        }
        if (result.error.code === 'FORBIDDEN') {
            return forbiddenResponse();
        }
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
});

// DELETE /api/events/[id] - 이벤트 삭제
export const DELETE = withAuth<{ id: string }>(async (_request, { user, params }) => {
    const { id } = params;

    // deleteEvent 내부에서 소유권 검증
    const result = await deleteEvent(id, user.id);

    if (!isSuccess(result)) {
        if (result.error.code === 'NOT_FOUND') {
            return notFoundResponse('이벤트');
        }
        if (result.error.code === 'FORBIDDEN') {
            return forbiddenResponse();
        }
        return internalErrorResponse(result.error.message);
    }

    return successResponse(null);
});
