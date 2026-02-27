// hooks/use-user.ts
/**
 * User 데이터 읽기 훅 + User 뮤테이션 훅
 *
 * user 데이터는 EditorData(entryKeys.all) 쿼리 캐시에서 파생.
 * StoreInitializer가 initialData로 hydration하므로 실제 suspend 없음.
 */

import type { EditorData } from '@/lib/services/user.service';
import type { User } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entryKeys, useEditorData } from './use-editor-data';

// ============================================
// Query Hook
// ============================================

export function useUser(): User {
    const { data } = useEditorData();
    return data.user;
}

// ============================================
// API Functions
// ============================================

async function patchProfile(userId: string, updates: Partial<Pick<User, 'displayName' | 'bio'>>) {
    const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const json = await res.json();
    return json.data as User;
}

async function postAvatar(userId: string, formData: FormData) {
    const res = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload avatar');
    const json = await res.json();
    return json.data as { avatarUrl: string };
}

async function removeAvatar(userId: string) {
    const res = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete avatar');
}

// ============================================
// Mutation Hook
// ============================================

export function useUserMutations() {
    const queryClient = useQueryClient();

    const updateProfile = useMutation({
        mutationFn: ({
            userId,
            updates,
        }: {
            userId: string;
            updates: Partial<Pick<User, 'displayName' | 'bio'>>;
        }) => patchProfile(userId, updates),
        onMutate: async ({ updates }) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    user: { ...previous.user, ...updates },
                });
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(entryKeys.all, ctx.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });

    const uploadAvatar = useMutation({
        mutationFn: ({ userId, formData }: { userId: string; formData: FormData }) =>
            postAvatar(userId, formData),
        onSuccess: (data) => {
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    user: { ...previous.user, avatarUrl: data.avatarUrl },
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });

    const deleteAvatar = useMutation({
        mutationFn: ({ userId }: { userId: string }) => removeAvatar(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    user: { ...previous.user, avatarUrl: '' },
                });
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(entryKeys.all, ctx.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });

    return { updateProfile, uploadAvatar, deleteAvatar };
}
