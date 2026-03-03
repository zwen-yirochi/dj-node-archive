// hooks/use-page.ts
/**
 * Page settings read + mutation hooks
 *
 * Page settings (headerStyle, etc.) are cached under ['page'].
 * Mutations update via PATCH /api/pages/[id] with optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { HeaderStyle, ProfileLink } from '@/types';
import { toast } from '@/hooks/use-toast';

import { pageKeys, usePageMeta, type PageMeta } from './use-editor-data';

// ============================================
// API Functions
// ============================================

async function patchPage(
    pageId: string,
    updates: { header_style?: HeaderStyle; links?: ProfileLink[] }
): Promise<void> {
    const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update page');
}

// ============================================
// Mutation Hook
// ============================================

export function usePageMutations() {
    const queryClient = useQueryClient();

    const updateHeaderStyle = useMutation({
        mutationFn: ({ pageId, headerStyle }: { pageId: string; headerStyle: HeaderStyle }) =>
            patchPage(pageId, { header_style: headerStyle }),
        onMutate: async ({ headerStyle }) => {
            await queryClient.cancelQueries({ queryKey: pageKeys.all });
            const previous = queryClient.getQueryData<PageMeta>(pageKeys.all);
            if (previous) {
                queryClient.setQueryData<PageMeta>(pageKeys.all, {
                    ...previous,
                    pageSettings: { ...previous.pageSettings, headerStyle },
                });
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(pageKeys.all, ctx.previous);
            }
            toast({ variant: 'destructive', title: 'Failed to update header style.' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: pageKeys.all });
        },
    });

    const updateLinks = useMutation({
        mutationFn: ({ pageId, links }: { pageId: string; links: ProfileLink[] }) =>
            patchPage(pageId, { links }),
        onMutate: async ({ links }) => {
            await queryClient.cancelQueries({ queryKey: pageKeys.all });
            const previous = queryClient.getQueryData<PageMeta>(pageKeys.all);
            if (previous) {
                queryClient.setQueryData<PageMeta>(pageKeys.all, {
                    ...previous,
                    pageSettings: { ...previous.pageSettings, links },
                });
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(pageKeys.all, ctx.previous);
            }
            toast({ variant: 'destructive', title: 'Failed to save links.' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: pageKeys.all });
        },
    });

    return { updateHeaderStyle, updateLinks };
}

// Re-export for convenience
export { usePageMeta };
