// hooks/use-editor-data.ts
/**
 * Query keys & hooks — entries / user / page / entryDetail
 *
 * Server data is prefetched in page.tsx and hydrated via HydrationBoundary.
 * Hooks call useSuspenseQuery — cache hit from hydration, no network request on mount.
 */

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import type { ContentEntry, PageSettings, User } from '@/types';

// ============================================
// Query Keys
// ============================================

export const userKeys = {
    all: ['user'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
};

export const entryKeys = {
    all: ['entries'] as const,
    detail: (id: string) => ['entries', id] as const,
};

export const pageKeys = {
    all: ['page'] as const,
};

export interface PageMeta {
    pageId: string | null;
    pageSettings: PageSettings;
}

// ============================================
// API Functions
// ============================================

async function fetchEntries(): Promise<ContentEntry[]> {
    const res = await fetch('/api/editor/data');
    if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`);
    const json = await res.json();
    return json.data.contentEntries;
}

async function fetchUser(): Promise<User> {
    const res = await fetch('/api/editor/data');
    if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
    const json = await res.json();
    return json.data.user;
}

async function fetchPageMeta(): Promise<PageMeta> {
    const res = await fetch('/api/editor/data');
    if (!res.ok) throw new Error(`Failed to fetch page meta: ${res.status}`);
    const json = await res.json();
    return {
        pageId: json.data.pageId,
        pageSettings: json.data.pageSettings ?? { headerStyle: 'minimal', links: [] },
    };
}

async function fetchEntryDetail(id: string): Promise<ContentEntry> {
    const res = await fetch(`/api/entries/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch entry: ${res.status}`);
    const json = await res.json();
    return json.data;
}

// ============================================
// Query Hooks
// ============================================

export function useEntries() {
    return useSuspenseQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEntries,
        staleTime: 60_000,
    });
}

export function useUserQuery() {
    return useSuspenseQuery({
        queryKey: userKeys.all,
        queryFn: fetchUser,
        staleTime: 5 * 60_000,
    });
}

export function usePageMeta() {
    return useSuspenseQuery({
        queryKey: pageKeys.all,
        queryFn: fetchPageMeta,
        staleTime: 60_000,
    });
}

export function useEntryDetail(id: string) {
    const queryClient = useQueryClient();

    return useSuspenseQuery({
        queryKey: entryKeys.detail(id),
        queryFn: () => fetchEntryDetail(id),
        initialData: () => {
            const entries = queryClient.getQueryData<ContentEntry[]>(entryKeys.all);
            return entries?.find((e) => e.id === id);
        },
        initialDataUpdatedAt: () => {
            return queryClient.getQueryState(entryKeys.all)?.dataUpdatedAt;
        },
        staleTime: 60_000,
    });
}
