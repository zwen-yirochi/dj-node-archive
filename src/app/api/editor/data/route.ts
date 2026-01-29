// app/api/editor/data/route.ts
import { getEditorData } from '@/lib/services/user.service';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // TODO: 인증 체크 추가
    // const session = await auth();
    // if (session?.user?.username !== username) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await getEditorData(username);

    if (!isSuccess(result)) {
        const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
        return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json(result.data);
}
