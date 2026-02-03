// app/api/view-items/reorder/route.ts
import { updateViewItemOrder } from '@/lib/db/queries/page-view.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

interface ReorderItem {
    id: string;
    orderIndex: number;
}

// PATCH /api/view-items/reorder - View items 순서 일괄 변경
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { updates } = body as { updates: ReorderItem[] };

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ error: 'updates 배열이 필요합니다.' }, { status: 400 });
        }

        const result = await updateViewItemOrder(updates);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/view-items/reorder error:', err);
        return NextResponse.json({ error: 'View items 순서 변경 실패' }, { status: 500 });
    }
}
