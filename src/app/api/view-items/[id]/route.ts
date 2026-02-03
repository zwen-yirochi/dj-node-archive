// app/api/view-items/[id]/route.ts
import { removeViewItem, setViewItemVisibility } from '@/lib/db/queries/page-view.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/view-items/[id] - View에서 제거
export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const { id } = await params;

        const result = await removeViewItem(id);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/view-items/[id] error:', err);
        return NextResponse.json({ error: 'View item 삭제 실패' }, { status: 500 });
    }
}

// PATCH /api/view-items/[id] - View item 표시 여부 변경
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { isVisible } = body as { isVisible: boolean };

        if (typeof isVisible !== 'boolean') {
            return NextResponse.json({ error: 'isVisible 값이 필요합니다.' }, { status: 400 });
        }

        const result = await setViewItemVisibility(id, isVisible);

        if (!isSuccess(result)) {
            const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
            return NextResponse.json({ error: result.error.message }, { status });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('PATCH /api/view-items/[id] error:', err);
        return NextResponse.json({ error: 'View item 수정 실패' }, { status: 500 });
    }
}
