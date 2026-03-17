import type { ContentEntry } from '@/types/domain';
import { toast } from '@/hooks/use-toast';
import { computeReorderedPositions } from '@/app/dashboard/hooks/entries.api';
import { entryKeys } from '@/app/dashboard/hooks/use-editor-data';

import type { DragContext, DragData, DragStrategy } from '../types';

/**
 * 사이드바 엔트리 드래그 — 두 가지 시나리오:
 * 1. entry → entry (같은 타입 내 순서 변경)
 * 2. entry → section-drop (섹션에 추가)
 */
export const sidebarEntryReorder: DragStrategy = {
    activeTypes: ['entry'],

    acceptsOver: (active, over) => {
        if (over.type === 'entry' && over.entry?.type === active.entry?.type) return true;
        if (over.type === 'section-drop') return true;
        return false;
    },

    onEnd: (event, ctx) => {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current as DragData;
        const overData = over.data.current as DragData;

        // entry → section-drop: 섹션에 추가
        if (overData.type === 'section-drop' && overData.sectionId && activeData.entry) {
            ctx.sectionMutations.addEntryToSection(overData.sectionId, activeData.entry.id);
            return;
        }

        // entry → entry: 같은 타입 내 정렬
        if (overData.type !== 'entry') return;
        if (activeData.entry?.type !== overData.entry?.type || active.id === over.id) return;

        const currentEntries = ctx.getEntries();
        const typeEntries = currentEntries
            .filter((e) => e.type === activeData.entry!.type)
            .sort((a, b) => a.position - b.position);
        const overIndex = typeEntries.findIndex((e) => e.id === over.id);
        if (overIndex === -1) return;

        const updates = computeReorderedPositions(
            currentEntries,
            activeData.entry!.type,
            activeData.entry!.id,
            overIndex
        );
        if (!updates) return;

        const posMap = new Map(updates.map((u) => [u.id, u.position]));
        ctx.queryClient.setQueryData<ContentEntry[]>(entryKeys.all, (prev) =>
            prev?.map((e) => {
                const newPos = posMap.get(e.id);
                return newPos !== undefined ? { ...e, position: newPos } : e;
            })
        );
        ctx.reorderEntriesMutation.mutate(
            { updates },
            { onError: () => toast({ variant: 'destructive', title: 'Failed to reorder' }) }
        );
    },
};
