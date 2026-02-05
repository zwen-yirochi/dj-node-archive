/**
 * displayEntryStore.ts - Display Entry 상태 관리
 *
 * 공개 페이지에 표시되는 DisplayEntry와 미리보기 트리거를 관리합니다.
 * previewVersion이 ContentEntryStore에서 이동됨.
 */

import { create } from 'zustand';

export interface DisplayEntry {
    id: string;
    entryId: string;
    order: number;
    isVisible: boolean;
}

interface DisplayEntryStore {
    displayEntries: DisplayEntry[];

    // 미리보기 업데이트 트리거 (ContentEntryStore에서 이동)
    // Display 변경, 엔트리 변경 시 증가
    previewVersion: number;

    // 동기 액션
    setDisplayEntries: (entries: DisplayEntry[]) => void;
    isInView: (entryId: string) => boolean;
    getDisplayEntryByEntryId: (entryId: string) => DisplayEntry | undefined;

    // 미리보기 트리거
    triggerPreviewRefresh: () => void;

    // 비동기 액션 (API 연동)
    addToView: (pageId: string, entryId: string, position?: number) => Promise<void>;
    removeFromView: (displayEntryId: string) => Promise<void>;
    removeFromViewByEntryId: (entryId: string) => Promise<void>;
    reorderView: (displayEntryId: string, newPosition: number) => Promise<void>;
    toggleVisibility: (displayEntryId: string) => Promise<void>;
}

export const useDisplayEntryStore = create<DisplayEntryStore>((set, get) => ({
    displayEntries: [],
    previewVersion: 0,

    setDisplayEntries: (entries) => set({ displayEntries: entries }),

    isInView: (entryId) => {
        return get().displayEntries.some((entry) => entry.entryId === entryId);
    },

    getDisplayEntryByEntryId: (entryId) => {
        return get().displayEntries.find((entry) => entry.entryId === entryId);
    },

    triggerPreviewRefresh: () => {
        set((state) => ({ previewVersion: state.previewVersion + 1 }));
    },

    addToView: async (pageId, entryId, position) => {
        const { displayEntries } = get();

        // 이미 View에 있으면 추가하지 않음
        if (displayEntries.some((entry) => entry.entryId === entryId)) {
            return;
        }

        if (!pageId) {
            console.error('pageId가 없습니다.');
            return;
        }

        const orderIndex = position ?? displayEntries.length;

        // 낙관적 업데이트를 위한 임시 ID
        const tempId = crypto.randomUUID();
        const newEntry: DisplayEntry = {
            id: tempId,
            entryId,
            order: orderIndex,
            isVisible: true,
        };

        let newEntries: DisplayEntry[];
        if (position !== undefined) {
            newEntries = [...displayEntries];
            newEntries.splice(position, 0, newEntry);
            newEntries = newEntries.map((entry, index) => ({
                ...entry,
                order: index,
            }));
        } else {
            newEntries = [...displayEntries, newEntry];
        }

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            displayEntries: newEntries,
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch('/api/display-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, entryId, orderIndex }),
            });

            if (!response.ok) {
                set({ displayEntries });
                console.error('Display entry 추가 실패');
                return;
            }

            const result = await response.json();

            // 서버에서 받은 실제 ID로 업데이트
            set((s) => ({
                displayEntries: s.displayEntries.map((entry) =>
                    entry.id === tempId ? { ...entry, id: result.data.id } : entry
                ),
            }));

            // position이 있으면 순서 재정렬 API 호출
            if (position !== undefined && newEntries.length > 1) {
                const updates = newEntries.map((entry, index) => ({
                    id: entry.id === tempId ? result.data.id : entry.id,
                    orderIndex: index,
                }));

                await fetch('/api/display-entries/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates }),
                });
            }
        } catch (error) {
            set({ displayEntries });
            console.error('Display entry 추가 오류:', error);
        }
    },

    removeFromView: async (displayEntryId) => {
        const { displayEntries } = get();
        const previousEntries = displayEntries;

        // 낙관적 업데이트
        const newEntries = displayEntries
            .filter((entry) => entry.id !== displayEntryId)
            .map((entry, index) => ({ ...entry, order: index }));

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            displayEntries: newEntries,
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/display-entries/${displayEntryId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                set({ displayEntries: previousEntries });
                console.error('Display entry 삭제 실패');
                return;
            }

            // 순서 재정렬 API 호출
            if (newEntries.length > 0) {
                const updates = newEntries.map((entry, index) => ({
                    id: entry.id,
                    orderIndex: index,
                }));

                await fetch('/api/display-entries/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates }),
                });
            }
        } catch (error) {
            set({ displayEntries: previousEntries });
            console.error('Display entry 삭제 오류:', error);
        }
    },

    removeFromViewByEntryId: async (entryId) => {
        const displayEntry = get().getDisplayEntryByEntryId(entryId);
        if (displayEntry) {
            await get().removeFromView(displayEntry.id);
        }
    },

    reorderView: async (displayEntryId, newPosition) => {
        const { displayEntries } = get();
        const previousEntries = displayEntries;

        const currentIndex = displayEntries.findIndex((entry) => entry.id === displayEntryId);
        if (currentIndex === -1) return;

        // 낙관적 업데이트
        const newEntries = [...displayEntries];
        const [movedEntry] = newEntries.splice(currentIndex, 1);
        newEntries.splice(newPosition, 0, movedEntry);

        const reorderedEntries = newEntries.map((entry, index) => ({
            ...entry,
            order: index,
        }));

        set({ displayEntries: reorderedEntries });

        try {
            const updates = reorderedEntries.map((entry) => ({
                id: entry.id,
                orderIndex: entry.order,
            }));

            const response = await fetch('/api/display-entries/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                set({ displayEntries: previousEntries });
                console.error('Display entry 순서 변경 실패');
            }
        } catch (error) {
            set({ displayEntries: previousEntries });
            console.error('Display entry 순서 변경 오류:', error);
        }
    },

    toggleVisibility: async (displayEntryId) => {
        const { displayEntries } = get();
        const previousEntries = displayEntries;
        const targetEntry = displayEntries.find((entry) => entry.id === displayEntryId);

        if (!targetEntry) return;

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            displayEntries: displayEntries.map((entry) =>
                entry.id === displayEntryId ? { ...entry, isVisible: !entry.isVisible } : entry
            ),
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/display-entries/${displayEntryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !targetEntry.isVisible }),
            });

            if (!response.ok) {
                set({ displayEntries: previousEntries });
                console.error('Display entry 표시 여부 변경 실패');
            }
        } catch (error) {
            set({ displayEntries: previousEntries });
            console.error('Display entry 표시 여부 변경 오류:', error);
        }
    },
}));
