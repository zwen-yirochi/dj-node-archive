import type { DragStrategy } from '../types';
import { sectionEntryReorder } from './section-entry-reorder';
import { sectionReorder } from './section-reorder';
import { sidebarEntryReorder } from './sidebar-entry-reorder';

/**
 * 전략 배열 — Provider가 activeData.type으로 매칭.
 * 각 전략의 onEnd에서 overData.type을 추가 검증하여 세부 분기 처리.
 */
export const dashboardStrategies: DragStrategy[] = [
    sidebarEntryReorder,
    sectionReorder,
    sectionEntryReorder,
];
