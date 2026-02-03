'use server';

import { updateUser as updateUserQuery } from '@/lib/db/queries/user.queries';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

/**
 * 현재 로그인한 사용자 ID 확인
 */
async function getAuthenticatedUserId(): Promise<string | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * 프로필 정보 업데이트 (displayName, bio)
 */
export async function updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string }
): Promise<ActionResult> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId || authenticatedUserId !== userId) {
        return { success: false, error: '권한이 없습니다' };
    }

    const result = await updateUserQuery(userId, {
        display_name: data.displayName,
        bio: data.bio,
    });

    if (!result.success) {
        return { success: false, error: result.error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * 아바타 이미지 업로드
 */
export async function uploadAvatar(
    userId: string,
    formData: FormData
): Promise<ActionResult<{ avatarUrl: string }>> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId || authenticatedUserId !== userId) {
        return { success: false, error: '권한이 없습니다' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: '파일이 없습니다' };
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: '파일 크기는 5MB 이하여야 합니다' };
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'JPG, PNG, WebP, GIF 형식만 지원합니다' };
    }

    try {
        const supabase = await createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // 기존 아바타 삭제 (있는 경우)
        const { data: userData } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        if (userData?.avatar_url?.includes('avatars')) {
            const oldPath = userData.avatar_url.split('/avatars/')[1];
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
            return { success: false, error: '이미지 업로드에 실패했습니다' };
        }

        // Public URL 가져오기
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

        // DB 업데이트
        const result = await updateUserQuery(userId, { avatar_url: urlData.publicUrl });
        if (!result.success) {
            return { success: false, error: result.error.message };
        }

        revalidatePath('/dashboard');
        return { success: true, data: { avatarUrl: urlData.publicUrl } };
    } catch {
        return { success: false, error: '이미지 업로드 중 오류가 발생했습니다' };
    }
}

/**
 * 아바타 이미지 삭제
 */
export async function deleteAvatar(userId: string): Promise<ActionResult> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId || authenticatedUserId !== userId) {
        return { success: false, error: '권한이 없습니다' };
    }

    try {
        const supabase = await createClient();

        // 현재 아바타 URL 가져오기
        const { data: userData } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        // Storage에서 파일 삭제
        if (userData?.avatar_url?.includes('avatars')) {
            const oldPath = userData.avatar_url.split('/avatars/')[1];
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
            }
        }

        // DB 업데이트
        const result = await updateUserQuery(userId, { avatar_url: '' });
        if (!result.success) {
            return { success: false, error: result.error.message };
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch {
        return { success: false, error: '아바타 삭제 중 오류가 발생했습니다' };
    }
}
