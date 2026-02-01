// app/api/events/route.ts
import { createEvent, findEventsByUserId } from '@/lib/db/queries/event.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

// POST /api/events - 이벤트 생성
export async function POST(request: Request) {
    try {
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

        // 필수 필드 검증
        if (!venue_ref_id) {
            return NextResponse.json({ error: '베뉴를 선택해주세요.' }, { status: 400 });
        }

        if (!date) {
            return NextResponse.json({ error: '날짜를 입력해주세요.' }, { status: 400 });
        }

        const result = await createEvent({
            user_id: user.id,
            venue_ref_id,
            title: title?.trim() || undefined,
            date,
            data: data || {},
        });

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data }, { status: 201 });
    } catch (err) {
        console.error('POST /api/events error:', err);
        return NextResponse.json({ error: '이벤트 생성 실패' }, { status: 500 });
    }
}

// GET /api/events - 이벤트 목록 조회 (현재 유저)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

        // user_id가 없으면 현재 인증된 유저의 이벤트 조회
        let targetUserId = userId;

        if (!targetUserId) {
            const supabase = await createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
            }

            targetUserId = user.id;
        }

        const result = await findEventsByUserId(targetUserId, limit);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: result.data });
    } catch (err) {
        console.error('GET /api/events error:', err);
        return NextResponse.json({ error: '이벤트 목록 조회 실패' }, { status: 500 });
    }
}
