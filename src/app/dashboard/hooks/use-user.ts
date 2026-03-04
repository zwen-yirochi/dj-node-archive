// hooks/use-user.ts
/**
 * User data read hook + User mutation hook
 *
 * User data is managed in an independent cache ['user'].
 * StoreInitializer hydrates with initialData, so no actual suspend occurs.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/types';

import { userKeys, useUserQuery } from './use-editor-data';

// ============================================
// Query Hook
// ============================================

export function useUser(): User {
    const { data } = useUserQuery();
    return data;
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
            await queryClient.cancelQueries({ queryKey: userKeys.all });
            const previous = queryClient.getQueryData<User>(userKeys.all);
            if (previous) {
                queryClient.setQueryData<User>(userKeys.all, {
                    ...previous,
                    ...updates,
                });
            }
            return { previous };
        },
        onSuccess: (serverUser) => {
            queryClient.setQueryData<User>(userKeys.all, serverUser);
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(userKeys.all, ctx.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const uploadAvatar = useMutation({
        mutationFn: ({ userId, formData }: { userId: string; formData: FormData }) =>
            postAvatar(userId, formData),
        onSuccess: (data) => {
            queryClient.setQueryData<User>(userKeys.all, (prev) =>
                prev ? { ...prev, avatarUrl: data.avatarUrl } : prev
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const deleteAvatar = useMutation({
        mutationFn: ({ userId }: { userId: string }) => removeAvatar(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: userKeys.all });
            const previous = queryClient.getQueryData<User>(userKeys.all);
            if (previous) {
                queryClient.setQueryData<User>(userKeys.all, {
                    ...previous,
                    avatarUrl: '',
                });
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(userKeys.all, ctx.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    return { updateProfile, uploadAvatar, deleteAvatar };
}
