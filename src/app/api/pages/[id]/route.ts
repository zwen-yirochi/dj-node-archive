// app/api/pages/[id]/route.ts
import {
    withAuth,
    verifyPageOwnership,
    successResponse,
    forbiddenResponse,
    notFoundResponse,
    internalErrorResponse,
} from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/pages/[id] - 페이지 업데이트 (테마 등)
export const PATCH = withAuth<{ id: string }>(async (request, { user, params }) => {
    const { id } = params;

    // 소유권 검증
    const ownership = await verifyPageOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
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

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Page update error:', error);
        return internalErrorResponse('페이지 업데이트 실패');
    }

    return successResponse(data);
});
