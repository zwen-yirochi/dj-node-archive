// app/api/events/[id]/route.ts
import { findEventWithVenueById, updateEvent, deleteEvent } from '@/lib/db/queries/event.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/events/[id] - 이벤트 상세 조회
export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const result = await findEventWithVenueById(id);

        if (!isSuccess(result)) {
            if (result.error.code === 'NOT_FOUND') {
                return NextResponse.json({ error: result.error.message }, { status: 404 });
            }
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: result.data });
    } catch (err) {
        console.error('GET /api/events/[id] error:', err);
        return NextResponse.json({ error: '이벤트 조회 실패' }, { status: 500 });
    }
}

// PATCH /api/events/[id] - 이벤트 수정
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 인증 확인
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { venue_ref_id, title, date, data } = body;

        const result = await updateEvent(id, user.id, {
            venue_ref_id,
            title: title?.trim(),
            date,
            data,
        });

        if (!isSuccess(result)) {
            if (result.error.code === 'NOT_FOUND') {
                return NextResponse.json({ error: result.error.message }, { status: 404 });
            }
            if (result.error.code === 'FORBIDDEN') {
                return NextResponse.json({ error: result.error.message }, { status: 403 });
            }
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('PATCH /api/events/[id] error:', err);
        return NextResponse.json({ error: '이벤트 수정 실패' }, { status: 500 });
    }
}

// DELETE /api/events/[id] - 이벤트 삭제
export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 인증 확인
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const result = await deleteEvent(id, user.id);

        if (!isSuccess(result)) {
            if (result.error.code === 'NOT_FOUND') {
                return NextResponse.json({ error: result.error.message }, { status: 404 });
            }
            if (result.error.code === 'FORBIDDEN') {
                return NextResponse.json({ error: result.error.message }, { status: 403 });
            }
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/events/[id] error:', err);
        return NextResponse.json({ error: '이벤트 삭제 실패' }, { status: 500 });
    }
}
