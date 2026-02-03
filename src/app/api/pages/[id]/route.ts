import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

// PATCH /api/pages/[id] - 페이지 업데이트 (테마 등)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 현재 사용자 확인
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 페이지 소유권 확인
        const { data: page, error: pageError } = await supabase
            .from('pages')
            .select('user_id')
            .eq('id', id)
            .single();

        if (pageError || !page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        if (page.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { theme, is_public } = body;

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (theme !== undefined) {
            updateData.theme = theme;
        }

        if (is_public !== undefined) {
            updateData.is_public = is_public;
        }

        const { data, error } = await supabase
            .from('pages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Page update error:', error);
            return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Page PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
