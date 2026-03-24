// hooks/use-user.ts
/**
 * User data read hook + User mutation hook
 *
 * User data is managed in an independent cache ['user'].
 * HydrationBoundary prefills the cache from the server, so no actual suspend occurs.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/types';

import { userKeys, useUserQuery } from './use-editor-data';
import { triggerPreviewRefresh } from './use-preview-actions';

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

async function patchProfile(
    userId: string,
    updates: Partial<Pick<User, 'displayName' | 'bio' | 'region'>>
) {
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

async function patchUsername(userId: string, username: string) {
    const res = await fetch(`/api/users/${userId}/username`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to update username');
    }
    const json = await res.json();
    return json.data as User;
}

export async function checkUsernameAvailable(username: string, excludeId?: string) {
    const params = new URLSearchParams({ username });
    if (excludeId) params.set('excludeId', excludeId);
    const res = await fetch(`/api/users/check-username?${params}`);
    if (!res.ok) throw new Error('Failed to check username');
    const json = await res.json();
    return json.data as { available: boolean; reason?: string };
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
            updates: Partial<Pick<User, 'displayName' | 'bio' | 'region'>>;
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
            triggerPreviewRefresh('userpage');
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
            triggerPreviewRefresh('userpage');
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
        onSuccess: () => {
            triggerPreviewRefresh('userpage');
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

    const updateUsernameMutation = useMutation({
        mutationFn: ({ userId, username }: { userId: string; username: string }) =>
            patchUsername(userId, username),
        onSuccess: (serverUser) => {
            queryClient.setQueryData<User>(userKeys.all, serverUser);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    return { updateProfile, uploadAvatar, deleteAvatar, updateUsername: updateUsernameMutation };
}
