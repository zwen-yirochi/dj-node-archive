import { v4 as uuidv4 } from 'uuid';
import { useCallback, useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Section, ViewType } from '@/types/domain';

import { pageKeys, type PageMeta } from './use-editor-data';
import { triggerPreviewRefresh } from './use-preview-actions';

const DEBOUNCE_MS = 300;

async function patchSections(pageId: string, sections: Section[]) {
    const res = await fetch(`/api/pages/${pageId}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`[patchSections] ${res.status}:`, text);
        throw new Error('Failed to update sections');
    }
    return res.json();
}

export function useSectionMutations() {
    const queryClient = useQueryClient();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Server save mutation (no debounce) ──
    const saveMutation = useMutation({
        mutationFn: async () => {
            const current = queryClient.getQueryData<PageMeta>(pageKeys.all);
            if (!current?.pageId || !current.sections) return;
            await patchSections(current.pageId, current.sections);
        },
        onSuccess: () => triggerPreviewRefresh('userpage'),
    });

    // ── Cache-only update (no save, no debounce) ──
    const setSections = useCallback(
        (updater: (prev: Section[]) => Section[]) => {
            queryClient.setQueryData(pageKeys.all, (prev: PageMeta | undefined) => {
                if (!prev) return prev;
                return { ...prev, sections: updater(prev.sections) };
            });
        },
        [queryClient]
    );

    // ── Cache update + debounced save ──
    const updateSections = useCallback(
        (updater: (prev: Section[]) => Section[]) => {
            setSections(updater);

            // Debounced server save
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(async () => {
                const current = queryClient.getQueryData<PageMeta>(pageKeys.all);
                if (current?.pageId && current.sections) {
                    await patchSections(current.pageId, current.sections).catch(console.error);
                }
                triggerPreviewRefresh('userpage');
            }, DEBOUNCE_MS);
        },
        [queryClient, setSections]
    );

    // ── Actions ──

    const addSection = useCallback(
        (viewType: ViewType) => {
            const newSection: Section = {
                id: uuidv4(),
                viewType,
                title: null,
                entryIds: [],
                isVisible: true,
                options: {},
            };
            updateSections((prev) => [...prev, newSection]);
        },
        [updateSections]
    );

    const removeSection = useCallback(
        (sectionId: string) => {
            updateSections((prev) => prev.filter((s) => s.id !== sectionId));
        },
        [updateSections]
    );

    const updateSectionField = useCallback(
        (sectionId: string, field: Partial<Pick<Section, 'title' | 'viewType' | 'isVisible'>>) => {
            updateSections((prev) =>
                prev.map((s) => (s.id === sectionId ? { ...s, ...field } : s))
            );
        },
        [updateSections]
    );

    const reorderSections = useCallback(
        (fromIndex: number, toIndex: number) => {
            updateSections((prev) => {
                const next = [...prev];
                const [moved] = next.splice(fromIndex, 1);
                next.splice(toIndex, 0, moved);
                return next;
            });
        },
        [updateSections]
    );

    const addEntryToSection = useCallback(
        (sectionId: string, entryId: string) => {
            updateSections((prev) => {
                // '__first__' → add to the first section
                const targetId = sectionId === '__first__' ? prev[0]?.id : sectionId;
                if (!targetId) return prev;
                return prev.map((s) => {
                    if (s.id !== targetId) return s;
                    if (s.entryIds.includes(entryId)) return s;
                    return { ...s, entryIds: [...s.entryIds, entryId] };
                });
            });
        },
        [updateSections]
    );

    const removeEntryFromSection = useCallback(
        (sectionId: string, entryId: string) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id !== sectionId) return s;
                    return { ...s, entryIds: s.entryIds.filter((id) => id !== entryId) };
                })
            );
        },
        [updateSections]
    );

    const reorderEntryInSection = useCallback(
        (sectionId: string, fromIndex: number, toIndex: number) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id !== sectionId) return s;
                    const next = [...s.entryIds];
                    const [moved] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, moved);
                    return { ...s, entryIds: next };
                })
            );
        },
        [updateSections]
    );

    const moveEntryBetweenSections = useCallback(
        (fromSectionId: string, toSectionId: string, entryId: string, toIndex: number) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id === fromSectionId) {
                        return { ...s, entryIds: s.entryIds.filter((id) => id !== entryId) };
                    }
                    if (s.id === toSectionId) {
                        const next = [...s.entryIds];
                        next.splice(toIndex, 0, entryId);
                        return { ...s, entryIds: next };
                    }
                    return s;
                })
            );
        },
        [updateSections]
    );

    const removeEntryFromAllSections = useCallback(
        (entryId: string) => {
            updateSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    entryIds: s.entryIds.filter((id) => id !== entryId),
                }))
            );
        },
        [updateSections]
    );

    return {
        addSection,
        removeSection,
        updateSectionField,
        reorderSections,
        addEntryToSection,
        removeEntryFromSection,
        reorderEntryInSection,
        moveEntryBetweenSections,
        removeEntryFromAllSections,
        /** Cache-only: 서버 저장 없이 sections 배열만 업데이트 (DnD onDragOver용) */
        setSections,
        /** 현재 cache를 서버에 저장 (DnD onDragEnd용) */
        saveMutation,
    };
}
