// hooks/use-mutations.ts
/**
 * 단일 composite 뮤테이션 훅 — useEntryMutations()
 *
 * 8개 뮤테이션을 하나의 훅으로 통합. 각 뮤테이션은
 * mutationFn + optimisticUpdate + triggersPreview 선언만으로 구성.
 *
 * 캐시 대상: ContentEntry[] (순수 배열)
 */

import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ContentEntry } from '@/types';
import {
    canAddToView,
    FIELD_CONFIG,
    type FieldConfig,
} from '@/app/dashboard/config/entryFieldConfig';
import type { PublishOption } from '@/app/dashboard/config/workflowOptions';

import {
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
    const snapshotRef = useRef<ContentEntry[] | undefined>(undefined);

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
            optimisticUpdate: ({ entry }, entries) => [...entries, entry],
            triggersPreview: true,
        })
    );

    const update = useMutation(
        m<{ entry: ContentEntry; changedFields?: string[] }>({
            mutationFn: ({ entry }) => updateEntry({ id: entry.id, entry }),
            optimisticUpdate: ({ entry }, entries) =>
                entries.map((e) => (e.id === entry.id ? entry : e)),
            triggersPreview: ({ entry, changedFields }) =>
                hasPreviewField(entry.type, changedFields),
        })
    );

    const remove = useMutation(
        m<string>({
            mutationFn: (id) => deleteEntry(id),
            optimisticUpdate: (id, entries) => entries.filter((e) => e.id !== id),
            triggersPreview: (id, snapshot) => wasVisibleEntry(snapshot, id),
        })
    );

    // ── Display ──

    const addToDisplay = useMutation(
        m<string>({
            mutationFn: (entryId, entries) => {
                const orders = (entries ?? [])
                    .filter((e) => typeof e.displayOrder === 'number')
                    .map((e) => e.displayOrder!);
                const next = orders.length > 0 ? Math.max(...orders) + 1 : 0;
                return updateEntry({ id: entryId, displayOrder: next, isVisible: true });
            },
            optimisticUpdate: (entryId, entries) => {
                const target = entries.find((e) => e.id === entryId);
                if (!target || typeof target.displayOrder === 'number') return entries;

                const orders = entries
                    .filter((e) => typeof e.displayOrder === 'number')
                    .map((e) => e.displayOrder!);
                const next = orders.length > 0 ? Math.max(...orders) + 1 : 0;

                return entries.map((e) =>
                    e.id === entryId ? { ...e, displayOrder: next, isVisible: true } : e
                );
            },
            triggersPreview: true,
        })
    );

    const removeFromDisplay = useMutation(
        m<string>({
            mutationFn: (entryId) => updateEntry({ id: entryId, displayOrder: null }),
            optimisticUpdate: (entryId, entries) =>
                entries.map((e) => (e.id === entryId ? { ...e, displayOrder: null } : e)),
            triggersPreview: true,
        })
    );

    const toggleVisibility = useMutation(
        m<string>({
            mutationFn: (entryId, entries) => {
                const entry = entries?.find((e) => e.id === entryId);
                if (!entry || typeof entry.displayOrder !== 'number') return Promise.resolve();
                return updateEntry({ id: entryId, isVisible: !entry.isVisible });
            },
            optimisticUpdate: (entryId, entries) =>
                entries.map((e) => (e.id === entryId ? { ...e, isVisible: !e.isVisible } : e)),
            triggersPreview: true,
        })
    );

    // ── Reorder ──

    const reorder = useMutation(
        m<{ updates: { id: string; position: number }[] }>({
            mutationFn: ({ updates }) => reorderEntries(updates),
            optimisticUpdate: ({ updates }, entries) => {
                const positionMap = new Map(updates.map((u) => [u.id, u.position]));
                return entries.map((entry) => {
                    const newPos = positionMap.get(entry.id);
                    return newPos !== undefined ? { ...entry, position: newPos } : entry;
                });
            },
        })
    );

    const reorderDisplay = useMutation(
        m<{ updates: { id: string; displayOrder: number }[] }>({
            mutationFn: ({ updates }) => reorderDisplayAPI(updates),
            optimisticUpdate: ({ updates }, entries) => {
                const orderMap = new Map(updates.map((u) => [u.id, u.displayOrder]));
                return entries.map((e) => {
                    const newOrder = orderMap.get(e.id);
                    return newOrder !== undefined ? { ...e, displayOrder: newOrder } : e;
                });
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

// ============================================
// Preview Trigger Helpers
// ============================================

/** 변경된 필드 중 프리뷰에 영향을 주는 필드가 있는지 판단 */
function hasPreviewField(type: ContentEntry['type'], changedFields?: string[]): boolean {
    if (!changedFields?.length) return false;
    const fields: FieldConfig[] | undefined = FIELD_CONFIG[type];
    if (!fields) return false;
    return changedFields.some((key) => fields.find((f) => f.key === key)?.triggersPreview);
}

/** 삭제 대상이 공개 페이지에 표시 중인지 판단 */
function wasVisibleEntry(snapshot: ContentEntry[], id: string): boolean {
    const entry = snapshot.find((e) => e.id === id);
    return !!entry && canAddToView(entry);
}
