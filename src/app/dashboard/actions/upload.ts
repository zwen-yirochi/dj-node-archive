'use server';

import { createClient } from '@/lib/supabase/server';

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
 * 포스터 이미지 업로드 (posters 버킷)
 */
export async function uploadPoster(
    formData: FormData
): Promise<ActionResult<{ posterUrl: string }>> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId) {
        return { success: false, error: 'Authentication required' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File size must be under 10MB' };
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Only JPG, PNG, WebP formats are supported' };
    }

    try {
        const supabase = await createClient();
        // Content-Type에서 확장자 추출 (압축된 파일의 경우 name이 달라질 수 있음)
        const extMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        const fileExt = extMap[file.type] || file.name.split('.').pop();
        const fileName = `${authenticatedUserId}/${Date.now()}.${fileExt}`;

        // 새 파일 업로드
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from('posters')
            .upload(fileName, arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { success: false, error: 'Failed to upload image' };
        }

        // Public URL 가져오기
        const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);

        return { success: true, data: { posterUrl: urlData.publicUrl } };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'An error occurred while uploading' };
    }
}

/**
 * 포스터 이미지 삭제 (URL에서 경로 추출)
 */
export async function deletePoster(posterUrl: string): Promise<ActionResult> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId) {
        return { success: false, error: 'Authentication required' };
    }

    // URL에서 사용자 ID 확인 (본인 파일만 삭제 가능)
    if (!posterUrl.includes(`/posters/${authenticatedUserId}/`)) {
        return { success: false, error: 'Permission denied' };
    }

    try {
        const supabase = await createClient();

        // URL에서 경로 추출
        const path = posterUrl.split('/posters/')[1];
        if (!path) {
            return { success: false, error: 'Invalid poster URL' };
        }

        const { error } = await supabase.storage.from('posters').remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: 'Failed to delete image' };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'An error occurred while deleting' };
    }
}
