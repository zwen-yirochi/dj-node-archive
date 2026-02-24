// hooks/use-mutations.ts
/**
 * 단일 composite 뮤테이션 훅 — useEntryMutations()
 *
 * 8개 뮤테이션을 하나의 훅으로 통합. 각 뮤테이션은
 * mutationFn + optimisticUpdate 선언만으로 구성.
 */

import type { EditorData } from '@/lib/services/user.service';
import type { ContentEntry } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import {
    createEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
    reorderDisplay as reorderDisplayAPI,
    computeReorderedPositions,
    computeReorderedDisplay,
} from './entries.api';
import { makeOptimisticMutation, type OptimisticMutationConfig } from './optimistic-mutation';

type PublishOption = 'publish' | 'private';

export function useEntryMutations() {
    const queryClient = useQueryClient();
    const snapshotRef = useRef<EditorData | undefined>(undefined);

    const m = <T>(config: OptimisticMutationConfig<T>) =>
        makeOptimisticMutation(queryClient, snapshotRef, config);

    // ── CRUD ──

    const create = useMutation(
        m<{ pageId: string; entry: ContentEntry; publishOption?: PublishOption }>({
            mutationFn: (params) =>
                createEntry({
                    pageId: params.pageId,
                    entry: params.entry,
                    publishOption: params.publishOption ?? 'private',
                }),
            optimisticUpdate: ({ entry }, data) => ({
                ...data,
                contentEntries: [...data.contentEntries, entry],
            }),
        })
    );

    const update = useMutation(
        m<{ entry: ContentEntry }>({
            mutationFn: ({ entry }) => updateEntry({ id: entry.id, entry }),
            optimisticUpdate: ({ entry }, data) => ({
                ...data,
                contentEntries: data.contentEntries.map((e) => (e.id === entry.id ? entry : e)),
            }),
        })
    );

    const remove = useMutation(
        m<string>({
            mutationFn: (id) => deleteEntry(id),
            optimisticUpdate: (id, data) => ({
                ...data,
                contentEntries: data.contentEntries.filter((e) => e.id !== id),
            }),
        })
    );

    // ── Display ──

    const addToDisplay = useMutation(
        m<string>({
            mutationFn: (entryId, data) => {
                const entries = data?.contentEntries ?? [];
                const orders = entries
                    .filter((e) => typeof e.displayOrder === 'number')
                    .map((e) => e.displayOrder!);
                const next = orders.length > 0 ? Math.max(...orders) + 1 : 0;
                return updateEntry({ id: entryId, displayOrder: next, isVisible: true });
            },
            optimisticUpdate: (entryId, data) => {
                const target = data.contentEntries.find((e) => e.id === entryId);
                if (!target || typeof target.displayOrder === 'number') return data;

                const orders = data.contentEntries
                    .filter((e) => typeof e.displayOrder === 'number')
                    .map((e) => e.displayOrder!);
                const next = orders.length > 0 ? Math.max(...orders) + 1 : 0;

                return {
                    ...data,
                    contentEntries: data.contentEntries.map((e) =>
                        e.id === entryId ? { ...e, displayOrder: next, isVisible: true } : e
                    ),
                };
            },
        })
    );

    const removeFromDisplay = useMutation(
        m<string>({
            mutationFn: (entryId) => updateEntry({ id: entryId, displayOrder: null }),
            optimisticUpdate: (entryId, data) => ({
                ...data,
                contentEntries: data.contentEntries.map((e) =>
                    e.id === entryId ? { ...e, displayOrder: null } : e
                ),
            }),
        })
    );

    const toggleVisibility = useMutation(
        m<string>({
            mutationFn: (entryId, data) => {
                const entry = data?.contentEntries.find((e) => e.id === entryId);
                if (!entry || typeof entry.displayOrder !== 'number') return Promise.resolve();
                return updateEntry({ id: entryId, isVisible: !entry.isVisible });
            },
            optimisticUpdate: (entryId, data) => ({
                ...data,
                contentEntries: data.contentEntries.map((e) =>
                    e.id === entryId ? { ...e, isVisible: !e.isVisible } : e
                ),
            }),
        })
    );

    // ── Reorder ──

    const reorder = useMutation(
        m<{ type: ContentEntry['type']; entryId: string; newPosition: number }>({
            mutationFn: ({ type, entryId, newPosition }, data) => {
                const updates = computeReorderedPositions(
                    data?.contentEntries ?? [],
                    type,
                    entryId,
                    newPosition
                );
                return updates ? reorderEntries(updates) : Promise.resolve();
            },
            optimisticUpdate: ({ type, entryId, newPosition }, data) => {
                const updates = computeReorderedPositions(
                    data.contentEntries,
                    type,
                    entryId,
                    newPosition
                );
                if (!updates) return data;

                const positionMap = new Map(updates.map((u) => [u.id, u.position]));
                return {
                    ...data,
                    contentEntries: data.contentEntries.map((entry) => {
                        const newPos = positionMap.get(entry.id);
                        return newPos !== undefined ? { ...entry, position: newPos } : entry;
                    }),
                };
            },
        })
    );

    const reorderDisplay = useMutation(
        m<{ entryId: string; newIndex: number }>({
            mutationFn: ({ entryId, newIndex }, data) => {
                const updates = computeReorderedDisplay(
                    data?.contentEntries ?? [],
                    entryId,
                    newIndex
                );
                return updates ? reorderDisplayAPI(updates) : Promise.resolve();
            },
            optimisticUpdate: ({ entryId, newIndex }, data) => {
                const updates = computeReorderedDisplay(data.contentEntries, entryId, newIndex);
                if (!updates) return data;

                const orderMap = new Map(updates.map((u) => [u.id, u.displayOrder]));
                return {
                    ...data,
                    contentEntries: data.contentEntries.map((e) => {
                        const newOrder = orderMap.get(e.id);
                        return newOrder !== undefined ? { ...e, displayOrder: newOrder } : e;
                    }),
                };
            },
        })
    );

    return {
        create,
        update,
        remove,
        addToDisplay,
        removeFromDisplay,
        toggleVisibility,
        reorder,
        reorderDisplay,
    };
}
