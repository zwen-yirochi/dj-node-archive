import { create } from 'zustand';

/**
 * DND Bridge Store — 드롭 순간의 비동기 갭을 메우는 임시 상태.
 *
 * 문제: TQ setQueryData → 구독 → 리렌더 사이에 1프레임 갭이 있어서
 * dnd-kit이 transform을 제거하면 아이템이 원래 위치로 돌아갔다가 점프.
 *
 * 해결: 드롭 직후 동기적으로 temp order를 설정하여 즉시 리렌더.
 * TQ 캐시가 따라잡으면 temp를 null로 초기화.
 */
interface DndBridgeState {
    tempEntryOrder: string[] | null;
    tempSectionOrder: string[] | null;
    tempSectionEntryOrder: Record<string, string[]> | null;
    setTempEntryOrder: (ids: string[] | null) => void;
    setTempSectionOrder: (ids: string[] | null) => void;
    setTempSectionEntryOrder: (order: Record<string, string[]> | null) => void;
}

export const useDndBridgeStore = create<DndBridgeState>((set) => ({
    tempEntryOrder: null,
    tempSectionOrder: null,
    tempSectionEntryOrder: null,
    setTempEntryOrder: (ids) => set({ tempEntryOrder: ids }),
    setTempSectionOrder: (ids) => set({ tempSectionOrder: ids }),
    setTempSectionEntryOrder: (order) => set({ tempSectionEntryOrder: order }),
}));
