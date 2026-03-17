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

        // Case A: section-entry → section-drop (빈 섹션에 이동)
        if (overData.type === 'section-drop' && overData.sectionId) {
            if (activeSectionId !== overData.sectionId) {
                ctx.sectionMutations.moveEntryBetweenSections(
                    activeSectionId,
                    overData.sectionId,
                    activeEntryId,
                    0
                );
            }
            return;
        }

        // Case B: section-entry → section-entry
        if (overData.type !== 'section-entry' || !overData.sectionId || !overData.entry?.id) return;

        const overSectionId = overData.sectionId;
        const overEntryId = overData.entry.id;
        const sections = ctx.getPageMeta()?.sections ?? [];

        if (activeSectionId === overSectionId) {
            const section = sections.find((s) => s.id === activeSectionId);
            if (!section) return;
            const fromIdx = section.entryIds.indexOf(activeEntryId);
            const toIdx = section.entryIds.indexOf(overEntryId);
            if (fromIdx !== -1 && toIdx !== -1) {
                ctx.sectionMutations.reorderEntryInSection(activeSectionId, fromIdx, toIdx);
            }
        } else {
            const toSection = sections.find((s) => s.id === overSectionId);
            if (!toSection) return;
            const toIdx = toSection.entryIds.indexOf(overEntryId);
            ctx.sectionMutations.moveEntryBetweenSections(
                activeSectionId,
                overSectionId,
                activeEntryId,
                toIdx
            );
        }
    },
};
