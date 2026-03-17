import { useDndBridgeStore } from '@/app/dashboard/stores/dndBridgeStore';

import type { DragData, DragStrategy } from '../types';

/**
 * 섹션 내 엔트리 정렬/이동
 * active: section-entry
 * over: section-entry (같은/다른 섹션) 또는 section-drop (빈 섹션에 이동)
 */
export const sectionEntryReorder: DragStrategy = {
    activeTypes: ['section-entry'],

    acceptsOver: () => true,

    onEnd: (event, ctx) => {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current as DragData;
        const overData = over.data.current as DragData;

        if (!activeData.sectionId || !activeData.entry) return;

        const activeSectionId = activeData.sectionId;
        const activeEntryId = activeData.entry.id;
        const sections = ctx.getPageMeta()?.sections ?? [];

        // Case A: section-entry → section-drop (빈 섹션에 이동)
        if (overData.type === 'section-drop' && overData.sectionId) {
            if (activeSectionId !== overData.sectionId) {
                const fromSection = sections.find((s) => s.id === activeSectionId);
                const toSection = sections.find((s) => s.id === overData.sectionId);
                if (fromSection && toSection) {
                    useDndBridgeStore.getState().setTempSectionEntryOrder({
                        [activeSectionId]: fromSection.entryIds.filter(
                            (id) => id !== activeEntryId
                        ),
                        [overData.sectionId]: [...toSection.entryIds, activeEntryId],
                    });
                }

                ctx.sectionMutations.moveEntryBetweenSections(
                    activeSectionId,
                    overData.sectionId,
                    activeEntryId,
                    0
                );
                useDndBridgeStore.getState().setTempSectionEntryOrder(null);
            }
            return;
        }

        // Case B: section-entry → section-entry
        if (overData.type !== 'section-entry' || !overData.sectionId || !overData.entry?.id) return;

        const overSectionId = overData.sectionId;
        const overEntryId = overData.entry.id;

        if (activeSectionId === overSectionId) {
            // 같은 섹션 내 정렬
            const section = sections.find((s) => s.id === activeSectionId);
            if (!section) return;
            const fromIdx = section.entryIds.indexOf(activeEntryId);
            const toIdx = section.entryIds.indexOf(overEntryId);
            if (fromIdx === -1 || toIdx === -1) return;

            // Bridge: 새 순서 동기 설정
            const newIds = [...section.entryIds];
            const [moved] = newIds.splice(fromIdx, 1);
            newIds.splice(toIdx, 0, moved);
            useDndBridgeStore.getState().setTempSectionEntryOrder({
                [activeSectionId]: newIds,
            });

            ctx.sectionMutations.reorderEntryInSection(activeSectionId, fromIdx, toIdx);
            useDndBridgeStore.getState().setTempSectionEntryOrder(null);
        } else {
            // 다른 섹션으로 이동
            const fromSection = sections.find((s) => s.id === activeSectionId);
            const toSection = sections.find((s) => s.id === overSectionId);
            if (!fromSection || !toSection) return;
            const toIdx = toSection.entryIds.indexOf(overEntryId);

            // Bridge: 양쪽 섹션 동기 설정
            const newToIds = [...toSection.entryIds];
            newToIds.splice(toIdx, 0, activeEntryId);
            useDndBridgeStore.getState().setTempSectionEntryOrder({
                [activeSectionId]: fromSection.entryIds.filter((id) => id !== activeEntryId),
                [overSectionId]: newToIds,
            });

            ctx.sectionMutations.moveEntryBetweenSections(
                activeSectionId,
                overSectionId,
                activeEntryId,
                toIdx
            );
            useDndBridgeStore.getState().setTempSectionEntryOrder(null);
        }
    },
};
