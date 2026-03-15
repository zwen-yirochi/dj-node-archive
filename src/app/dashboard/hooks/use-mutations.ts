// hooks/use-mutations.ts
/**
 * Single composite mutation hook — useEntryMutations()
 *
 * Combines 8 mutations into one hook. Each mutation is defined
 * with just mutationFn + optimisticUpdate + triggersPreview.
 *
 * Cache target: ContentEntry[] (plain array)
 */

import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ContentEntry } from '@/types';
import { FIELD_CONFIG, type FieldConfig } from '@/app/dashboard/config/entry/entry-fields';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { canAddToView } from '@/app/dashboard/config/entry/entry-validation';

import type { PublishOption } from '../components/ContentPanel/create-forms/workflow-options';
import { createEntry, deleteEntry, reorderEntries, updateEntry } from './entries.api';
import { makeOptimisticMutation, type OptimisticMutationConfig } from './optimistic-mutation';
import { triggerPreviewRefresh, type PreviewTarget } from './use-preview-actions';

export function useEntryMutations() {
    const queryClient = useQueryClient();
    const snapshotRef = useRef<ContentEntry[] | undefined>(undefined);

    const onPreviewTrigger = (target: PreviewTarget) => triggerPreviewRefresh(target);

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
            previewTarget: ({ entry }) => previewTargetFor(entry.type),
        })
    );

    const updateField = useMutation(
        m<{ entryId: string; fieldKey: string; value: unknown }>({
            mutationFn: ({ entryId, fieldKey, value }, entries) => {
                const current = entries?.find((e) => e.id === entryId);
                if (!current) throw new Error('Entry not found in cache');
                const updated = { ...current, [fieldKey]: value } as ContentEntry;
                return updateEntry({ id: entryId, entry: updated });
            },
            optimisticUpdate: ({ entryId, fieldKey, value }, entries) =>
                entries.map((e) =>
                    e.id === entryId ? ({ ...e, [fieldKey]: value } as ContentEntry) : e
                ),
            triggersPreview: ({ entryId, fieldKey }, snapshot) => {
                const entry = snapshot.find((e) => e.id === entryId);
                return entry ? hasPreviewField(entry.type, [fieldKey]) : false;
            },
            previewTarget: ({ entryId }, snapshot) => {
                const entry = snapshot.find((e) => e.id === entryId);
                return previewTargetFor(entry?.type);
            },
        })
    );

    const remove = useMutation(
        m<string>({
            mutationFn: (id) => deleteEntry(id),
            optimisticUpdate: (id, entries) => entries.filter((e) => e.id !== id),
            triggersPreview: (id, snapshot) => wasVisibleEntry(snapshot, id),
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

    return {
        create,
        update,
        updateField,
        remove,
        reorder,
    };
}

// ============================================
// Preview Trigger Helpers
// ============================================

/** Returns the correct preview target based on whether the entry type has a detail page */
function previewTargetFor(type?: ContentEntry['type']): PreviewTarget {
    if (!type) return 'userpage';
    return ENTRY_TYPE_CONFIG[type].hasDetailPage ? 'entry-detail' : 'userpage';
}

/** Determines whether any changed fields affect the preview */
function hasPreviewField(type: ContentEntry['type'], changedFields?: string[]): boolean {
    if (!changedFields?.length) return false;
    const fields: FieldConfig[] | undefined = FIELD_CONFIG[type];
    if (!fields) return false;
    return changedFields.some((key) => fields.find((f) => f.key === key)?.triggersPreview);
}

/** Determines whether the deletion target is currently displayed on the public page */
function wasVisibleEntry(snapshot: ContentEntry[], id: string): boolean {
    const entry = snapshot.find((e) => e.id === id);
    return !!entry && canAddToView(entry);
}
