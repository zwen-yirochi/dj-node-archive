import type { DropAnimation } from '@dnd-kit/core';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';

/**
 * 드래그 중 주변 아이템은 부드럽게 이동, 드롭된 아이템은 즉시 안착.
 * - wasDragging: 드롭 직후 → 애니메이션 끄기 (슬라이딩 방지)
 * - 그 외: 항상 애니메이션 (defaultAnimateLayoutChanges가 특정 조건에서 false를 반환하여
 *   transition이 누락되는 문제 방지)
 */
export const sortableAnimateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting) return true;
    if (args.wasDragging) return false;
    return true;
};

/** DragOverlay 드롭 시 페이드아웃 애니메이션 */
export const defaultDropAnimation: DropAnimation = { duration: 150, easing: 'ease' };
