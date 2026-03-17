import type { DropAnimation } from '@dnd-kit/core';
import { defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable';

/**
 * 드래그 중 주변 아이템은 부드럽게 이동, 드롭된 아이템은 즉시 안착.
 * - wasDragging: 드롭 직후 → 애니메이션 끄기 (슬라이딩 방지)
 * - isSorting: 다른 아이템이 자리 비켜줄 때 → 애니메이션 켜기
 */
export const sortableAnimateLayoutChanges: AnimateLayoutChanges = (args) => {
    const { isSorting, wasDragging } = args;
    if (wasDragging) return false;
    if (isSorting) return true;
    return defaultAnimateLayoutChanges(args);
};

/** DragOverlay 드롭 시 페이드아웃 애니메이션 */
export const defaultDropAnimation: DropAnimation = { duration: 150, easing: 'ease' };
