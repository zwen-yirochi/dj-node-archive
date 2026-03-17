import { useDndBridgeStore } from '@/app/dashboard/stores/dndBridgeStore';

import type { DragData, DragStrategy } from '../types';

/**
 * 섹션 정렬 — 페이지 섹션 순서 변경
 * active: section, over: section
 * onDragEnd에서 bridge + 캐시 업데이트 + 서버 저장
 */
export const sectionReorder: DragStrategy = {
    activeTypes: ['section'],

    acceptsOver: (_active, over) => over.type === 'section',

    onEnd: (event, ctx) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const overData = over.data.current as DragData | undefined;
        if (overData?.type !== 'section') return;

        const sections = ctx.getPageMeta()?.sections ?? [];
        const fromIndex = sections.findIndex((s) => s.id === active.id);
        const toIndex = sections.findIndex((s) => s.id === over.id);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

        // Bridge: 동기적으로 새 순서 설정
        const reordered = [...sections];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        useDndBridgeStore.getState().setTempSectionOrder(reordered.map((s) => s.id));

        // 캐시 업데이트 + 서버 저장
        ctx.sectionMutations.setSections(() => reordered);
        ctx.sectionMutations.saveMutation.mutate();

        // TQ 캐시가 따라잡으면 bridge 해제
        useDndBridgeStore.getState().setTempSectionOrder(null);
    },
};
