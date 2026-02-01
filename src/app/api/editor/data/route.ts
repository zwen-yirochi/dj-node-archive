// app/api/editor/data/route.ts
import { getEditorDataByUserId } from '@/lib/services/user.service';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

export async function GET() {
    // 인증 확인
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const result = await getEditorDataByUserId(user.id);

    if (!isSuccess(result)) {
        const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
        return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json(result.data);
}
