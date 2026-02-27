// hooks/use-mutations.ts
/**
 * 단일 composite 뮤테이션 훅 — useEntryMutations()
 *
 * 8개 뮤테이션을 하나의 훅으로 통합. 각 뮤테이션은
 * mutationFn + optimisticUpdate + triggersPreview 선언만으로 구성.
 */

import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ContentEntry } from '@/types';
import type { EditorData } from '@/lib/services/user.service';
import { canAddToView } from '@/app/dashboard/config/entryFieldConfig';
import type { PublishOption } from '@/app/dashboard/config/workflowOptions';

import { shouldTriggerPreview } from '../lib/previewTrigger';
import {
    computeReorderedDisplay,
    computeReorderedPositions,
    createEntry,
    deleteEntry,
    reorderDisplay as reorderDisplayAPI,
    reorderEntries,
    updateEntry,
} from './entries.api';
import { makeOptimisticMutation, type OptimisticMutationConfig } from './optimistic-mutation';
import { triggerPreviewRefresh } from './use-preview-refresh';

export function useEntryMutations() {
    const queryClient = useQueryClient();
    const snapshotRef = useRef<EditorData | undefined>(undefined);

    const onPreviewTrigger = () => triggerPreviewRefresh();

    const m = <T>(config: OptimisticMutationConfig<T>) =>
        makeOptimisticMutation(queryClient, snapshotRef, { ...config, onPreviewTrigger });

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
            triggersPreview: true,
        })
    );

    const update = useMutation(
        m<{ entry: ContentEntry }>({
            mutationFn: ({ entry }) => updateEntry({ id: entry.id, entry }),
            optimisticUpdate: ({ entry }, data) => ({
                ...data,
                contentEntries: data.contentEntries.map((e) => (e.id === entry.id ? entry : e)),
            }),
            triggersPreview: ({ entry }, snapshot) => {
                const previous = snapshot.contentEntries.find((e) => e.id === entry.id);
                return !!previous && shouldTriggerPreview(previous, entry);
            },
        })
    );

    const remove = useMutation(
        m<string>({
            mutationFn: (id) => deleteEntry(id),
            optimisticUpdate: (id, data) => ({
                ...data,
                contentEntries: data.contentEntries.filter((e) => e.id !== id),
            }),
            triggersPreview: (id, snapshot) => {
                const entry = snapshot.contentEntries.find((e) => e.id === id);
                return !!entry && canAddToView(entry);
            },
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
            triggersPreview: true,
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
            triggersPreview: true,
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
            triggersPreview: true,
        })
    );

    // ── Reorder ──

    // reorder mutations: updates를 mutate 호출 시점에 확정하여 snapshotRef 경합 방지
    const reorder = useMutation(
        m<{ updates: { id: string; position: number }[] }>({
            mutationFn: ({ updates }) => reorderEntries(updates),
            optimisticUpdate: ({ updates }, data) => {
                const positionMap = new Map(updates.map((u) => [u.id, u.position]));
                return {
                    ...data,
                    contentEntries: data.contentEntries.map((entry) => {
                        const newPos = positionMap.get(entry.id);
                        return newPos !== undefined ? { ...entry, position: newPos } : entry;
                    }),
                };
            },
            // reorder는 섹션 내 순서만 변경, 페이지에 무관
        })
    );

    const reorderDisplay = useMutation(
        m<{ updates: { id: string; displayOrder: number }[] }>({
            mutationFn: ({ updates }) => reorderDisplayAPI(updates),
            optimisticUpdate: ({ updates }, data) => {
                const orderMap = new Map(updates.map((u) => [u.id, u.displayOrder]));
                return {
                    ...data,
                    contentEntries: data.contentEntries.map((e) => {
                        const newOrder = orderMap.get(e.id);
                        return newOrder !== undefined ? { ...e, displayOrder: newOrder } : e;
                    }),
                };
            },
            triggersPreview: true,
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
