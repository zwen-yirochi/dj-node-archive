import type { DragData, DragStrategy } from '../types';

/**
 * 섹션 정렬 — 페이지 섹션 순서 변경
 * active: section, over: section
 * onOver에서 실시간 리오더 (캐시만), onEnd에서 서버 저장
 */
export const sectionReorder: DragStrategy = {
    activeTypes: ['section'],

    acceptsOver: (_active, over) => over.type === 'section',

    onOver: (event, ctx) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const overData = over.data.current as DragData | undefined;
        if (overData?.type !== 'section') return;

        ctx.sectionMutations.setSections((prev) => {
            const fromIndex = prev.findIndex((s) => s.id === active.id);
            const toIndex = prev.findIndex((s) => s.id === over!.id);
            if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    },

    onEnd: (_event, ctx) => {
        ctx.sectionMutations.saveMutation.mutate();
    },
};
