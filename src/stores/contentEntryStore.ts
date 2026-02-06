/**
 * contentEntryStore.ts - 콘텐츠 엔트리 상태 관리
 *
 * 콘텐츠 엔트리 데이터를 관리합니다.
 */

import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators'; // >??
import type { ContentEntry } from '@/types';
import { create } from 'zustand';

interface ContentEntryStore {
    entries: ContentEntry[];
    pageId: string | null;
    newlyCreatedIds: Set<string>;
    previewVersion: number; // Display 변경 시 증가

    setEntries: (entries: ContentEntry[]) => void;
    setPageId: (pageId: string) => void;
    getEntryById: (id: string) => ContentEntry | undefined;
    isNewlyCreated: (id: string) => boolean;
    triggerPreviewRefresh: () => void;

    // 엔트리 CRUD 액션
    createEntry: (entry: ContentEntry, publishOption?: 'publish' | 'private') => Promise<string>;
    updateEntry: (entry: ContentEntry) => Promise<{ triggeredPreview: boolean }>;
    deleteEntry: (id: string) => Promise<{ triggeredPreview: boolean }>;
    finishCreating: (id: string) => void;
    reorderSectionItems: (
        type: 'event' | 'mixset' | 'link',
        entryId: string,
        newPosition: number
    ) => Promise<void>;

    // Display 관련 액션 (displayOrder 기반)
    addToDisplay: (entryId: string) => Promise<void>; // displayOrder 설정
    removeFromDisplay: (entryId: string) => Promise<void>; // displayOrder = null
    reorderDisplayEntries: (entryId: string, newIndex: number) => Promise<void>; // Page 내 순서 변경
    toggleVisibility: (entryId: string) => Promise<void>; // isVisible 토글 (임시 숨김)

    // Setter
    setDisplayedEntries: (entries: ContentEntry[]) => void; // 초기 displayed entries 설정

    // Getter
    getDisplayedEntries: () => ContentEntry[]; // displayOrder !== null
    getVisibleOnPageEntries: () => ContentEntry[]; // displayOrder !== null && isVisible
}

// Store instance for imperative access
const contentEntryStore = create<ContentEntryStore>((set, get) => ({
    entries: [],
    pageId: null,
    newlyCreatedIds: new Set<string>(),
    previewVersion: 0,

    setEntries: (entries) => set({ entries }),
    setPageId: (pageId) => set({ pageId }),

    setDisplayedEntries: (displayedEntries) => {
        // displayedEntries를 기존 entries에 병합 (id 기준으로 업데이트)
        set((state) => {
            const updatedEntries = state.entries.map((entry) => {
                const displayed = displayedEntries.find((d) => d.id === entry.id);
                return displayed ? displayed : entry;
            });
            return { entries: updatedEntries };
        });
    },

    getEntryById: (id) => {
        return get().entries.find((e) => e.id === id);
    },

    isNewlyCreated: (id) => {
        return get().newlyCreatedIds.has(id);
    },

    triggerPreviewRefresh: () => {
        set((state) => ({ previewVersion: state.previewVersion + 1 }));
    },

    /**
     * 새 엔트리 생성
     * - DB에 POST
     * - newlyCreatedIds에 추가
     * - 미리보기 트리거 안 함 (생성 중에는 불완전한 상태)
     */
    createEntry: async (entry, publishOption = 'private') => {
        const { entries, pageId, newlyCreatedIds } = get();

        // pageId 검증
        if (!pageId) {
            console.error('createEntry 실패: pageId가 설정되지 않았습니다.');
            throw new Error('Page ID is not set. Please refresh the page.');
        }

        // 낙관적 업데이트: 엔트리 추가 + newlyCreatedIds에 등록
        const updatedEntries = [...entries, entry];
        const updatedNewlyCreatedIds = new Set(newlyCreatedIds);
        updatedNewlyCreatedIds.add(entry.id);

        set({
            entries: updatedEntries,
            newlyCreatedIds: updatedNewlyCreatedIds,
        });

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, entry, publishOption }),
            });

            if (!response.ok) {
                // 롤백
                set({ entries, newlyCreatedIds });
                console.error('엔트리 생성 실패');
                throw new Error('엔트리 생성 실패');
            }

            return entry.id;
        } catch (error) {
            // 롤백
            set({ entries, newlyCreatedIds });
            console.error('엔트리 생성 오류:', error);
            throw error;
        }
    },

    /**
     * 기존 엔트리 수정
     * - DB에 PATCH
     * - 필드 레벨로 미리보기 트리거 여부 결정
     * @returns { triggeredPreview: boolean } - 호출부에서 DisplayEntryStore 트리거 결정용
     */
    updateEntry: async (entry) => {
        const { entries } = get();
        const existingIndex = entries.findIndex((e) => e.id === entry.id);

        if (existingIndex === -1) {
            console.error('수정할 엔트리를 찾을 수 없음:', entry.id);
            return { triggeredPreview: false };
        }

        const previousEntry = entries[existingIndex];
        const updatedEntries = entries.map((e) => (e.id === entry.id ? entry : e));

        // 필드 단위로 미리보기 트리거 여부 결정
        const triggeredPreview = shouldTriggerPreview(previousEntry, entry);

        // 낙관적 업데이트
        set({ entries: updatedEntries });

        try {
            const response = await fetch(`/api/entries/${entry.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entry }),
            });

            if (!response.ok) {
                // 롤백
                set({
                    entries: entries.map((e) => (e.id === entry.id ? previousEntry : e)),
                });
                console.error('엔트리 수정 실패');
                return { triggeredPreview: false };
            }

            return { triggeredPreview };
        } catch (error) {
            // 롤백
            set({
                entries: entries.map((e) => (e.id === entry.id ? previousEntry : e)),
            });
            console.error('엔트리 수정 오류:', error);
            return { triggeredPreview: false };
        }
    },

    /**
     * 엔트리 삭제
     * - 완성된 엔트리였다면 미리보기 트리거
     * @returns { triggeredPreview: boolean }
     */
    deleteEntry: async (id) => {
        const { entries, newlyCreatedIds } = get();
        const deletedEntry = entries.find((e) => e.id === id);

        if (!deletedEntry) {
            return { triggeredPreview: false };
        }

        // 삭제된 엔트리가 완성된 상태였다면 미리보기 새로고침 필요
        const triggeredPreview = canAddToView(deletedEntry);

        // newlyCreatedIds에서도 제거
        const updatedNewlyCreatedIds = new Set(newlyCreatedIds);
        updatedNewlyCreatedIds.delete(id);

        // 낙관적 업데이트
        set({
            entries: entries.filter((e) => e.id !== id),
            newlyCreatedIds: updatedNewlyCreatedIds,
        });

        try {
            const response = await fetch(`/api/entries/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // 롤백
                set({ entries, newlyCreatedIds });
                console.error('엔트리 삭제 실패');
                return { triggeredPreview: false };
            }

            return { triggeredPreview };
        } catch (error) {
            // 롤백
            set({ entries, newlyCreatedIds });
            console.error('엔트리 삭제 오류:', error);
            return { triggeredPreview: false };
        }
    },

    /**
     * 생성 완료 처리
     * - newlyCreatedIds에서 제거
     */
    finishCreating: (id) => {
        const { newlyCreatedIds } = get();
        const updated = new Set(newlyCreatedIds);
        updated.delete(id);
        set({ newlyCreatedIds: updated });
    },

    reorderSectionItems: async (type, entryId, newPosition) => {
        const { entries } = get();
        const previousEntries = entries;

        // position 순으로 정렬 후 작업
        const sectionEntries = entries
            .filter((e) => e.type === type)
            .sort((a, b) => a.position - b.position);

        const currentIndex = sectionEntries.findIndex((e) => e.id === entryId);
        if (currentIndex === -1) return;

        const reorderedSection = [...sectionEntries];
        const [movedEntry] = reorderedSection.splice(currentIndex, 1);
        reorderedSection.splice(newPosition, 0, movedEntry);

        // 새 position 매핑 생성
        const positionMap = new Map<string, number>();
        reorderedSection.forEach((entry, index) => {
            positionMap.set(entry.id, index);
        });

        // 전체 entries를 순회하며 해당 타입만 position 업데이트
        // displayOrder는 변경하지 않음!
        const updatedEntries = entries.map((entry) => {
            if (entry.type === type) {
                const newPos = positionMap.get(entry.id);
                if (newPos !== undefined) {
                    return { ...entry, position: newPos };
                }
            }
            return entry;
        });

        set({ entries: updatedEntries });

        try {
            const updates = reorderedSection.map((entry, index) => ({
                id: entry.id,
                position: index,
            }));

            const response = await fetch('/api/entries/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                set({ entries: previousEntries });
                console.error('엔트리 순서 변경 실패');
            }
        } catch (error) {
            set({ entries: previousEntries });
            console.error('엔트리 순서 변경 오류:', error);
        }
    },

    /**
     * Page에 추가 (displayOrder 설정)
     */
    addToDisplay: async (entryId) => {
        const { entries } = get();
        const previousEntries = entries;
        const targetEntry = entries.find((e) => e.id === entryId);

        // 이미 Page에 있으면 무시 (displayOrder가 숫자인 경우)
        if (!targetEntry || typeof targetEntry.displayOrder === 'number') return;

        // 현재 displayed 엔트리 중 최대 displayOrder 계산
        const displayedOrders = entries
            .filter((e) => typeof e.displayOrder === 'number')
            .map((e) => e.displayOrder!);
        const maxDisplayOrder = displayedOrders.length > 0 ? Math.max(...displayedOrders) : -1;
        const newDisplayOrder = maxDisplayOrder + 1;

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            entries: entries.map((e) =>
                e.id === entryId ? { ...e, displayOrder: newDisplayOrder, isVisible: true } : e
            ),
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayOrder: newDisplayOrder, isVisible: true }),
            });

            if (!response.ok) {
                set({ entries: previousEntries });
                console.error('Display 추가 실패');
            }
        } catch (error) {
            set({ entries: previousEntries });
            console.error('Display 추가 오류:', error);
        }
    },

    /**
     * Page에서 제거 (displayOrder = null)
     */
    removeFromDisplay: async (entryId) => {
        const { entries } = get();
        const previousEntries = entries;
        const targetEntry = entries.find((e) => e.id === entryId);

        // 이미 Page에 없으면 무시 (displayOrder가 숫자가 아닌 경우)
        if (!targetEntry || typeof targetEntry.displayOrder !== 'number') return;

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            entries: entries.map((e) => (e.id === entryId ? { ...e, displayOrder: null } : e)),
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayOrder: null }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Display 제거 실패:', response.status, errorText);
                set({ entries: previousEntries });
            }
        } catch (error) {
            set({ entries: previousEntries });
            console.error('Display 제거 오류:', error);
        }
    },

    /**
     * Page 내 순서 변경 (displayOrder 재배치)
     */
    reorderDisplayEntries: async (entryId, newIndex) => {
        const { entries } = get();
        const previousEntries = entries;

        // displayed 엔트리만 추출하고 displayOrder 순으로 정렬
        const displayedEntries = entries
            .filter((e) => typeof e.displayOrder === 'number')
            .sort((a, b) => a.displayOrder! - b.displayOrder!);

        const currentIndex = displayedEntries.findIndex((e) => e.id === entryId);
        if (currentIndex === -1) return;

        // 순서 변경
        const reordered = [...displayedEntries];
        const [moved] = reordered.splice(currentIndex, 1);
        reordered.splice(newIndex, 0, moved);

        // 새 displayOrder 할당
        const updates = reordered.map((entry, index) => ({
            id: entry.id,
            displayOrder: index,
        }));

        // 낙관적 업데이트
        const updatedEntries = entries.map((e) => {
            const update = updates.find((u) => u.id === e.id);
            return update ? { ...e, displayOrder: update.displayOrder } : e;
        });

        set((state) => ({
            entries: updatedEntries,
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch('/api/entries/reorder-display', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                set({ entries: previousEntries });
                console.error('Display 순서 변경 실패');
            }
        } catch (error) {
            set({ entries: previousEntries });
            console.error('Display 순서 변경 오류:', error);
        }
    },

    /**
     * Visibility 토글 (Page에 있을 때 임시 숨김/표시)
     */
    toggleVisibility: async (entryId) => {
        const { entries } = get();
        const previousEntries = entries;
        const targetEntry = entries.find((e) => e.id === entryId);

        // Page에 없으면 무시 (displayOrder가 숫자가 아닌 경우)
        if (!targetEntry || typeof targetEntry.displayOrder !== 'number') return;

        // 낙관적 업데이트 + 미리보기 트리거
        set((state) => ({
            entries: entries.map((e) => (e.id === entryId ? { ...e, isVisible: !e.isVisible } : e)),
            previewVersion: state.previewVersion + 1,
        }));

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !targetEntry.isVisible }),
            });

            if (!response.ok) {
                set({ entries: previousEntries });
                console.error('Visibility 변경 실패');
            }
        } catch (error) {
            set({ entries: previousEntries });
            console.error('Visibility 변경 오류:', error);
        }
    },

    /**
     * Page에 표시된 엔트리 목록 (displayOrder가 숫자인 경우만)
     */
    getDisplayedEntries: () => {
        return get()
            .entries.filter((e) => typeof e.displayOrder === 'number')
            .sort((a, b) => a.displayOrder! - b.displayOrder!);
    },

    /**
     * 공개 페이지에 실제로 보이는 엔트리 (displayOrder가 숫자 && isVisible)
     */
    getVisibleOnPageEntries: () => {
        return get()
            .entries.filter((e) => typeof e.displayOrder === 'number' && e.isVisible)
            .sort((a, b) => a.displayOrder! - b.displayOrder!);
    },
}));

// Hook export (기존 사용처와 호환)
export const useContentEntryStore = contentEntryStore;

// Imperative access for initialization
export const initializeContentEntryStore = (data: {
    entries: ContentEntry[];
    displayedEntries?: ContentEntry[];
    pageId: string;
}) => {
    const { setEntries, setPageId, setDisplayedEntries } = contentEntryStore.getState();

    setEntries(data.entries);
    setPageId(data.pageId);

    // displayedEntries가 별도로 제공되면 병합
    if (data.displayedEntries) {
        setDisplayedEntries(data.displayedEntries);
    }
};

// ============================================
// Utility Functions
// ============================================

export const getEntriesByType = (entries: ContentEntry[], type: 'event' | 'mixset' | 'link') =>
    entries.filter((e) => e.type === type);

export const getSelectedEntry = (entries: ContentEntry[], selectedEntryId: string | null) => {
    if (!selectedEntryId) return null;
    return entries.find((e) => e.id === selectedEntryId) ?? null;
};

// ============================================
// Deprecated Aliases (호환성 유지)
// ============================================

/** @deprecated Use getEntriesByType instead */
export const getComponentsByType = getEntriesByType;

/** @deprecated Use getSelectedEntry instead */
export const getSelectedComponent = getSelectedEntry;
