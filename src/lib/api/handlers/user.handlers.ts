// lib/api/handlers/user.handlers.ts
// User API 핸들러

import type { AuthContext } from '@/lib/api';
import {
    forbiddenResponse,
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/api';
import { findUserByAuthId, updateUser } from '@/lib/db/queries/user.queries';
import { mapUserToDomain } from '@/lib/mappers';
import { isSuccess } from '@/types/result';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Helpers
// ============================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Auth UUID로 앱 사용자를 조회하고 URL param id와 비교하여 ownership 검증
 */
async function verifyUserOwnership(authUserId: string, paramId: string) {
    const result = await findUserByAuthId(authUserId);
    if (!isSuccess(result) || !result.data) {
        return { ok: false as const };
    }
    if (result.data.id !== paramId) {
        return { ok: false as const };
    }
    return { ok: true as const, user: result.data };
}

// ============================================
// Handlers
// ============================================

/**
 * PATCH /api/users/[id]
 * 프로필 업데이트 (displayName, bio)
 */
export async function handleUpdateProfile(
    request: Request,
    { user, params }: AuthContext & { params: { id: string } }
) {
    // 1. Parse
    let body: { displayName?: string; bio?: string };
    try {
        body = await request.json();
    } catch {
        return validationErrorResponse('request body');
    }

    // 2. Verify ownership
    const ownership = await verifyUserOwnership(user.id, params.id);
    if (!ownership.ok) return forbiddenResponse();

    // 3. DB update
    const updates: { display_name?: string; bio?: string } = {};
    if (body.displayName !== undefined) updates.display_name = body.displayName;
    if (body.bio !== undefined) updates.bio = body.bio;

    const result = await updateUser(params.id, updates);
    if (!isSuccess(result)) return internalErrorResponse(result.error.message);

    // 4. Response
    return successResponse(mapUserToDomain(result.data));
}

/**
 * POST /api/users/[id]/avatar
 * 아바타 이미지 업로드
 */
export async function handleUploadAvatar(
    request: Request,
    { user, params }: AuthContext & { params: { id: string } }
) {
    // 1. Verify ownership
    const ownership = await verifyUserOwnership(user.id, params.id);
    if (!ownership.ok) return forbiddenResponse();

    // 2. Parse FormData
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return validationErrorResponse('form data');
    }

    const file = formData.get('file') as File | null;
    if (!file) return validationErrorResponse('file');

    // 3. Validate
    if (file.size > MAX_FILE_SIZE) {
        return internalErrorResponse('파일 크기는 5MB 이하여야 합니다');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return internalErrorResponse('JPG, PNG, WebP, GIF 형식만 지원합니다');
    }

    // 4. Logic — Storage 업로드
    try {
        const supabase = await createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${params.id}/${Date.now()}.${fileExt}`;

        // 기존 아바타 삭제
        if (ownership.user.avatar_url?.includes('avatars')) {
            const oldPath = ownership.user.avatar_url.split('/avatars/')[1];
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
            }
        }

        // 새 파일 업로드
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            return internalErrorResponse('이미지 업로드에 실패했습니다');
        }

        // Public URL
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

        // 5. DB update
        const result = await updateUser(params.id, { avatar_url: urlData.publicUrl });
        if (!isSuccess(result)) return internalErrorResponse(result.error.message);

        // 6. Response
        return successResponse({ avatarUrl: urlData.publicUrl });
    } catch {
        return internalErrorResponse('이미지 업로드 중 오류가 발생했습니다');
    }
}

/**
 * DELETE /api/users/[id]/avatar
 * 아바타 이미지 삭제
 */
export async function handleDeleteAvatar(
    request: Request,
    { user, params }: AuthContext & { params: { id: string } }
) {
    // 1. Verify ownership
    const ownership = await verifyUserOwnership(user.id, params.id);
    if (!ownership.ok) return forbiddenResponse();

    // 2. Logic — Storage 삭제
    try {
        if (ownership.user.avatar_url?.includes('avatars')) {
            const supabase = await createClient();
            const oldPath = ownership.user.avatar_url.split('/avatars/')[1];
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
            }
        }

        // 3. DB update
        const result = await updateUser(params.id, { avatar_url: '' });
        if (!isSuccess(result)) return internalErrorResponse(result.error.message);

        // 4. Response
        return successResponse(null);
    } catch {
        return internalErrorResponse('아바타 삭제 중 오류가 발생했습니다');
    }
}
