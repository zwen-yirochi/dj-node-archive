// hooks/use-editor-data.ts
/**
 * 에디터 데이터 쿼리 훅 — entryKeys, useEditorData, useEntryDetail
 */

import type { EditorData } from '@/lib/services/user.service';
import type { ContentEntry } from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

// ============================================
// Query Keys
// ============================================

export const entryKeys = {
    all: ['entries'] as const,
    detail: (id: string) => ['entries', id] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchEditorData(): Promise<EditorData> {
    const res = await fetch('/api/editor/data');
    if (!res.ok) throw new Error(`Failed to fetch editor data: ${res.status}`);
    const json = await res.json();
    return json.data;
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

export function useEditorData(initialData?: EditorData) {
    return useSuspenseQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEditorData,
        initialData,
        initialDataUpdatedAt: initialData ? Date.now() : undefined,
        staleTime: 60_000,
    });
}

export function useEntryDetail(id: string) {
    const queryClient = useQueryClient();

    return useSuspenseQuery({
        queryKey: entryKeys.detail(id),
        queryFn: () => fetchEntryDetail(id),
        initialData: () => {
            const listData = queryClient.getQueryData<EditorData>(entryKeys.all);
            return listData?.contentEntries.find((e) => e.id === id);
        },
        initialDataUpdatedAt: () => {
            return queryClient.getQueryState(entryKeys.all)?.dataUpdatedAt;
        },
        staleTime: 60_000,
    });
}
