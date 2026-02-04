/**
 * viewStore.ts - View 상태 관리
 *
 * 공개 페이지에 표시되는 DisplayEntry와 미리보기 트리거를 관리합니다.
 * previewVersion이 ComponentStore에서 이동됨.
 */

import { create } from 'zustand';

export interface DisplayEntry {
    id: string;
    componentId: string;
    order: number;
    isVisible: boolean;
}

/** @deprecated Use DisplayEntry instead */
export type ViewItem = DisplayEntry;

interface ViewStore {
    viewItems: DisplayEntry[];

    // 미리보기 업데이트 트리거 (ComponentStore에서 이동)
    // View 변경, 컴포넌트 변경 시 증가
    previewVersion: number;

    // 동기 액션
    setViewItems: (items: DisplayEntry[]) => void;
    isInView: (componentId: string) => boolean;
    getViewItemByComponentId: (componentId: string) => DisplayEntry | undefined;

    // 미리보기 트리거
    triggerPreviewRefresh: () => void;

    // 비동기 액션 (API 연동)
    addToView: (pageId: string, componentId: string, position?: number) => Promise<void>;
    removeFromView: (viewItemId: string) => Promise<void>;
    removeFromViewByComponentId: (componentId: string) => Promise<void>;
    reorderView: (viewItemId: string, newPosition: number) => Promise<void>;
    toggleViewItemVisibility: (viewItemId: string) => Promise<void>;
}

export const useViewStore = create<ViewStore>((set, get) => ({
    viewItems: [],
    previewVersion: 0,

    setViewItems: (items) => set({ viewItems: items }),

    isInView: (componentId) => {
        return get().viewItems.some((item) => item.componentId === componentId);
    },

    getViewItemByComponentId: (componentId) => {
        return get().viewItems.find((item) => item.componentId === componentId);
    },

    triggerPreviewRefresh: () => {
        set((state) => ({ previewVersion: state.previewVersion + 1 }));
    },

    addToView: async (pageId, componentId, position) => {
        const { viewItems } = get();

        // 이미 View에 있으면 추가하지 않음
        if (viewItems.some((item) => item.componentId === componentId)) {
            return;
        }

        if (!pageId) {
            console.error('pageId가 없습니다.');
            return;
        }

        const orderIndex = position ?? viewItems.length;

        // 낙관적 업데이트를 위한 임시 ID
        const tempId = crypto.randomUUID();
        const newItem: DisplayEntry = {
            id: tempId,
            componentId,
            order: orderIndex,
            isVisible: true,
        };

        let newItems: DisplayEntry[];
        if (position !== undefined) {
            newItems = [...viewItems];
            newItems.splice(position, 0, newItem);
            newItems = newItems.map((item, index) => ({
                ...item,
                order: index,
            }));
        } else {
            newItems = [...viewItems, newItem];
        }

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            viewItems: newItems,
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch('/api/view-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, componentId, orderIndex }),
            });

            if (!response.ok) {
                set({ viewItems });
                console.error('View item 추가 실패');
                return;
            }

            const result = await response.json();

            // 서버에서 받은 실제 ID로 업데이트
            set((s) => ({
                viewItems: s.viewItems.map((item) =>
                    item.id === tempId ? { ...item, id: result.data.id } : item
                ),
            }));

            // position이 있으면 순서 재정렬 API 호출
            if (position !== undefined && newItems.length > 1) {
                const updates = newItems.map((item, index) => ({
                    id: item.id === tempId ? result.data.id : item.id,
                    orderIndex: index,
                }));

                await fetch('/api/view-items/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates }),
                });
            }
        } catch (error) {
            set({ viewItems });
            console.error('View item 추가 오류:', error);
        }
    },

    removeFromView: async (viewItemId) => {
        const { viewItems } = get();
        const previousItems = viewItems;

        // 낙관적 업데이트
        const newItems = viewItems
            .filter((item) => item.id !== viewItemId)
            .map((item, index) => ({ ...item, order: index }));

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            viewItems: newItems,
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/view-items/${viewItemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                set({ viewItems: previousItems });
                console.error('View item 삭제 실패');
                return;
            }

            // 순서 재정렬 API 호출
            if (newItems.length > 0) {
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    orderIndex: index,
                }));

                await fetch('/api/view-items/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates }),
                });
            }
        } catch (error) {
            set({ viewItems: previousItems });
            console.error('View item 삭제 오류:', error);
        }
    },

    removeFromViewByComponentId: async (componentId) => {
        const viewItem = get().getViewItemByComponentId(componentId);
        if (viewItem) {
            await get().removeFromView(viewItem.id);
        }
    },

    reorderView: async (viewItemId, newPosition) => {
        const { viewItems } = get();
        const previousItems = viewItems;

        const currentIndex = viewItems.findIndex((item) => item.id === viewItemId);
        if (currentIndex === -1) return;

        // 낙관적 업데이트
        const newItems = [...viewItems];
        const [movedItem] = newItems.splice(currentIndex, 1);
        newItems.splice(newPosition, 0, movedItem);

        const reorderedItems = newItems.map((item, index) => ({
            ...item,
            order: index,
        }));

        set({ viewItems: reorderedItems });

        try {
            const updates = reorderedItems.map((item) => ({
                id: item.id,
                orderIndex: item.order,
            }));

            const response = await fetch('/api/view-items/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                set({ viewItems: previousItems });
                console.error('View item 순서 변경 실패');
            }
        } catch (error) {
            set({ viewItems: previousItems });
            console.error('View item 순서 변경 오류:', error);
        }
    },

    toggleViewItemVisibility: async (viewItemId) => {
        const { viewItems } = get();
        const previousItems = viewItems;
        const targetItem = viewItems.find((item) => item.id === viewItemId);

        if (!targetItem) return;

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            viewItems: viewItems.map((item) =>
                item.id === viewItemId ? { ...item, isVisible: !item.isVisible } : item
            ),
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/view-items/${viewItemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !targetItem.isVisible }),
            });

            if (!response.ok) {
                set({ viewItems: previousItems });
                console.error('View item 표시 여부 변경 실패');
            }
        } catch (error) {
            set({ viewItems: previousItems });
            console.error('View item 표시 여부 변경 오류:', error);
        }
    },
}));
