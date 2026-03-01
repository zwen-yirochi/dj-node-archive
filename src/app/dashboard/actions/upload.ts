'use server';

import { createClient } from '@/lib/supabase/server';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

/**
 * Verify the currently authenticated user ID
 */
async function getAuthenticatedUserId(): Promise<string | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * Upload poster image (posters bucket)
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

    // File size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File size must be under 10MB' };
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Only JPG, PNG, WebP formats are supported' };
    }

    try {
        const supabase = await createClient();
        // Extract extension from Content-Type (file name may differ for compressed files)
        const extMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        const fileExt = extMap[file.type] || file.name.split('.').pop();
        const fileName = `${authenticatedUserId}/${Date.now()}.${fileExt}`;

        // Upload new file
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

        // Get public URL
        const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);

        return { success: true, data: { posterUrl: urlData.publicUrl } };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'An error occurred while uploading' };
    }
}

/**
 * Delete poster image (extract path from URL)
 */
export async function deletePoster(posterUrl: string): Promise<ActionResult> {
    const authenticatedUserId = await getAuthenticatedUserId();

    if (!authenticatedUserId) {
        return { success: false, error: 'Authentication required' };
    }

    // Verify user ID from URL (can only delete own files)
    if (!posterUrl.includes(`/posters/${authenticatedUserId}/`)) {
        return { success: false, error: 'Permission denied' };
    }

    try {
        const supabase = await createClient();

        // Extract path from URL
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
