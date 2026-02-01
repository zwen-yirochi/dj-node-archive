import { createClient } from '@/lib/supabase/server';
import { updateUser } from '@/lib/db/queries/user.queries';
import { NextRequest, NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/users/[id]
 * 사용자 프로필 업데이트
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 본인만 수정 가능
    if (user.id !== id) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { displayName, bio, avatarUrl } = body;

        const result = await updateUser(id, {
            display_name: displayName,
            bio,
            avatar_url: avatarUrl,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        return NextResponse.json({ data: result.data });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
