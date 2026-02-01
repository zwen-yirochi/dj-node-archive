// app/api/components/reorder/route.ts
import { updateComponentPositions } from '@/lib/db/queries/component.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

interface ReorderItem {
    id: string;
    position: number;
}

export async function PATCH(request: Request) {
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
        const { updates } = body as { updates: ReorderItem[] };

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ error: 'updates 배열이 필요합니다.' }, { status: 400 });
        }

        const result = await updateComponentPositions(updates);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/components/reorder error:', err);
        return NextResponse.json({ error: '컴포넌트 순서 변경 실패' }, { status: 500 });
    }
}
