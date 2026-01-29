// app/api/editor/data/route.ts
import { getEditorData } from '@/lib/services/user.service';
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

    const data = await getEditorData(username);

    if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
}
