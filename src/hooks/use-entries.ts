// hooks/use-entries.ts
/**
 * TanStack Query 기반 엔트리 관리 훅
 *
 * 서버 상태(CRUD, 캐싱)를 TanStack Query로 관리합니다.
 * UI 상태(previewVersion, newlyCreatedIds)는 useDashboardUIStore에서 관리합니다.
 */

import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import type { EditorData } from '@/lib/services/user.service';
import type { ContentEntry } from '@/types';
import { isDisplayed } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

async function createEntryAPI(params: {
    pageId: string;
    entry: ContentEntry;
    publishOption: string;
}): Promise<{ id: string }> {
    const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Failed to create entry: ${res.status}`);
    const json = await res.json();
    return json.data;
}

async function updateEntryAPI(params: {
    id: string;
    entry?: ContentEntry;
    displayOrder?: number | null;
    isVisible?: boolean;
}): Promise<void> {
    const { id, ...body } = params;
    const res = await fetch(`/api/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to update entry: ${res.status}`);
}

async function deleteEntryAPI(id: string): Promise<void> {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete entry: ${res.status}`);
}

async function reorderEntriesAPI(updates: { id: string; position: number }[]): Promise<void> {
    const res = await fetch('/api/entries/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error(`Failed to reorder entries: ${res.status}`);
}

async function reorderDisplayAPI(updates: { id: string; displayOrder: number }[]): Promise<void> {
    const res = await fetch('/api/entries/reorder-display', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error(`Failed to reorder display: ${res.status}`);
}

// ============================================
// Query Hook
// ============================================

export function useEditorData(initialData?: EditorData) {
    return useQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEditorData,
        initialData,
        initialDataUpdatedAt: initialData ? Date.now() : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================
// Mutation Hooks
// ============================================

type PublishOption = 'publish' | 'private';

export function useCreateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            pageId: string;
            entry: ContentEntry;
            publishOption?: PublishOption;
        }) =>
            createEntryAPI({
                pageId: params.pageId,
                entry: params.entry,
                publishOption: params.publishOption ?? 'private',
            }),
        onMutate: async ({ entry }) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: [...previous.contentEntries, entry],
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useUpdateEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { entry: ContentEntry }) =>
            updateEntryAPI({ id: params.entry.id, entry: params.entry }),
        onMutate: async ({ entry }) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                const previousEntry = previous.contentEntries.find((e) => e.id === entry.id);
                const triggeredPreview = previousEntry
                    ? shouldTriggerPreview(previousEntry, entry)
                    : false;

                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((e) =>
                        e.id === entry.id ? entry : e
                    ),
                });
                return { previous, triggeredPreview };
            }
            return { previous, triggeredPreview: false };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useDeleteEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteEntryAPI(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                const deletedEntry = previous.contentEntries.find((e) => e.id === id);
                const triggeredPreview = deletedEntry ? canAddToView(deletedEntry) : false;

                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.filter((e) => e.id !== id),
                });
                return { previous, triggeredPreview };
            }
            return { previous, triggeredPreview: false };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useAddToDisplay() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entryId: string) => {
            const data = queryClient.getQueryData<EditorData>(entryKeys.all);
            const entries = data?.contentEntries ?? [];
            const displayedOrders = entries
                .filter((e) => typeof e.displayOrder === 'number')
                .map((e) => e.displayOrder!);
            const maxDisplayOrder = displayedOrders.length > 0 ? Math.max(...displayedOrders) : -1;
            const newDisplayOrder = maxDisplayOrder + 1;

            return updateEntryAPI({
                id: entryId,
                displayOrder: newDisplayOrder,
                isVisible: true,
            });
        },
        onMutate: async (entryId) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                const targetEntry = previous.contentEntries.find((e) => e.id === entryId);
                if (!targetEntry || isDisplayed(targetEntry)) return { previous };

                const displayedOrders = previous.contentEntries
                    .filter((e) => typeof e.displayOrder === 'number')
                    .map((e) => e.displayOrder!);
                const maxDisplayOrder =
                    displayedOrders.length > 0 ? Math.max(...displayedOrders) : -1;
                const newDisplayOrder = maxDisplayOrder + 1;

                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((e) =>
                        e.id === entryId
                            ? { ...e, displayOrder: newDisplayOrder, isVisible: true }
                            : e
                    ),
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useRemoveFromDisplay() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entryId: string) => updateEntryAPI({ id: entryId, displayOrder: null }),
        onMutate: async (entryId) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((e) =>
                        e.id === entryId ? { ...e, displayOrder: null } : e
                    ),
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useToggleVisibility() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entryId: string) => {
            const data = queryClient.getQueryData<EditorData>(entryKeys.all);
            const entry = data?.contentEntries.find((e) => e.id === entryId);
            if (!entry || typeof entry.displayOrder !== 'number') {
                return Promise.resolve();
            }
            return updateEntryAPI({ id: entryId, isVisible: !entry.isVisible });
        },
        onMutate: async (entryId) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((e) =>
                        e.id === entryId ? { ...e, isVisible: !e.isVisible } : e
                    ),
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useReorderEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            type: ContentEntry['type'];
            entryId: string;
            newPosition: number;
        }) => {
            const data = queryClient.getQueryData<EditorData>(entryKeys.all);
            const entries = data?.contentEntries ?? [];
            const sectionEntries = entries
                .filter((e) => e.type === params.type)
                .sort((a, b) => a.position - b.position);

            const currentIndex = sectionEntries.findIndex((e) => e.id === params.entryId);
            if (currentIndex === -1) return Promise.resolve();

            const reordered = [...sectionEntries];
            const [moved] = reordered.splice(currentIndex, 1);
            reordered.splice(params.newPosition, 0, moved);

            const updates = reordered.map((entry, index) => ({
                id: entry.id,
                position: index,
            }));

            return reorderEntriesAPI(updates);
        },
        onMutate: async ({ type, entryId, newPosition }) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                const sectionEntries = previous.contentEntries
                    .filter((e) => e.type === type)
                    .sort((a, b) => a.position - b.position);

                const currentIndex = sectionEntries.findIndex((e) => e.id === entryId);
                if (currentIndex === -1) return { previous };

                const reordered = [...sectionEntries];
                const [moved] = reordered.splice(currentIndex, 1);
                reordered.splice(newPosition, 0, moved);

                const positionMap = new Map<string, number>();
                reordered.forEach((entry, index) => {
                    positionMap.set(entry.id, index);
                });

                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((entry) => {
                        if (entry.type === type) {
                            const newPos = positionMap.get(entry.id);
                            if (newPos !== undefined) {
                                return { ...entry, position: newPos };
                            }
                        }
                        return entry;
                    }),
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

export function useReorderDisplayEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { entryId: string; newIndex: number }) => {
            const data = queryClient.getQueryData<EditorData>(entryKeys.all);
            const entries = data?.contentEntries ?? [];
            const displayedEntries = entries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!);

            const currentIndex = displayedEntries.findIndex((e) => e.id === params.entryId);
            if (currentIndex === -1) return Promise.resolve();

            const reordered = [...displayedEntries];
            const [moved] = reordered.splice(currentIndex, 1);
            reordered.splice(params.newIndex, 0, moved);

            const updates = reordered.map((entry, index) => ({
                id: entry.id,
                displayOrder: index,
            }));

            return reorderDisplayAPI(updates);
        },
        onMutate: async ({ entryId, newIndex }) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            if (previous) {
                const displayedEntries = previous.contentEntries
                    .filter((e) => typeof e.displayOrder === 'number')
                    .sort((a, b) => a.displayOrder! - b.displayOrder!);

                const currentIndex = displayedEntries.findIndex((e) => e.id === entryId);
                if (currentIndex === -1) return { previous };

                const reordered = [...displayedEntries];
                const [moved] = reordered.splice(currentIndex, 1);
                reordered.splice(newIndex, 0, moved);

                const updates = reordered.map((entry, index) => ({
                    id: entry.id,
                    displayOrder: index,
                }));

                queryClient.setQueryData<EditorData>(entryKeys.all, {
                    ...previous,
                    contentEntries: previous.contentEntries.map((e) => {
                        const update = updates.find((u) => u.id === e.id);
                        return update ? { ...e, displayOrder: update.displayOrder } : e;
                    }),
                });
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(entryKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

// ============================================
// Utility Functions (re-exported from old store)
// ============================================

export const getEntriesByType = (entries: ContentEntry[], type: 'event' | 'mixset' | 'link') =>
    entries.filter((e) => e.type === type);

export const getSelectedEntry = (entries: ContentEntry[], selectedEntryId: string | null) => {
    if (!selectedEntryId) return null;
    return entries.find((e) => e.id === selectedEntryId) ?? null;
};
