import { useDndBridgeStore } from '@/app/dashboard/stores/dndBridgeStore';

import type { DragData, DragStrategy } from '../types';

/**
 * 섹션 내 엔트리 정렬 — 같은 섹션 안에서만 순서 변경
 * active: section-entry, over: section-entry (같은 섹션)
 */
export const sectionEntryReorder: DragStrategy = {
    activeTypes: ['section-entry'],

    acceptsOver: (active, over) => {
        // 같은 섹션 내 section-entry끼리만 허용
        if (over.type === 'section-entry' && over.sectionId === active.sectionId) return true;
        return false;
    },

    onEnd: (event, ctx) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeData = active.data.current as DragData;
        const overData = over.data.current as DragData;

        if (!activeData.sectionId || !activeData.entry) return;
        if (overData.type !== 'section-entry' || overData.sectionId !== activeData.sectionId)
            return;
        if (!overData.entry?.id) return;

        const sectionId = activeData.sectionId;
        const sections = ctx.getPageMeta()?.sections ?? [];
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        const fromIdx = section.entryIds.indexOf(activeData.entry.id);
        const toIdx = section.entryIds.indexOf(overData.entry.id);
        if (fromIdx === -1 || toIdx === -1) return;

        // Bridge: 새 순서 동기 설정
        const newIds = [...section.entryIds];
        const [moved] = newIds.splice(fromIdx, 1);
        newIds.splice(toIdx, 0, moved);
        useDndBridgeStore.getState().setTempSectionEntryOrder({ [sectionId]: newIds });

        ctx.sectionMutations.reorderEntryInSection(sectionId, fromIdx, toIdx);
        useDndBridgeStore.getState().setTempSectionEntryOrder(null);
    },
};
