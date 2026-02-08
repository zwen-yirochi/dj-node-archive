// stores/contentEntryStore.ts
/**
 * contentEntryStore.ts - 콘텐츠 엔트리 상태 관리
 *
 * 콘텐츠 엔트리 데이터를 관리합니다.
 */

import { apiFetch } from '@/lib/api/fetch-utils';
import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import { isDisplayed, type ContentEntry, type Result } from '@/types';
import { create } from 'zustand';

type PublishOption = 'publish' | 'private';
type UpdateResult = {
    success: boolean;
    triggeredPreview: boolean;
    error?: string;
};

interface ContentEntryStore {
    entries: ContentEntry[];
    pageId: string | null;
    newlyCreatedIds: Set<string>;
    previewVersion: number; // Display 변경 시 증가

    // 초기화 메서드 추가
    initialize: (data: { entries: ContentEntry[]; pageId: string }) => void;

    // Setters
    setEntries: (entries: ContentEntry[]) => void;
    setPageId: (pageId: string) => void;
    setDisplayedEntries: (entries: ContentEntry[]) => void;

    // Getters
    getEntryById: (id: string) => ContentEntry | undefined;
    getDisplayedEntries: () => ContentEntry[];
    getVisibleOnPageEntries: () => ContentEntry[];
    isNewlyCreated: (id: string) => boolean;

    // Actions
    triggerPreviewRefresh: () => void;
    createEntry: (entry: ContentEntry, publishOption?: PublishOption) => Promise<Result<string>>;
    updateEntry: (entry: ContentEntry) => Promise<UpdateResult>;
    deleteEntry: (id: string) => Promise<UpdateResult>;
    finishCreating: (id: string) => void;

    // Reordering
    reorderSectionItems: (
        type: ContentEntry['type'],
        entryId: string,
        newPosition: number
    ) => Promise<void>;
    reorderDisplayEntries: (entryId: string, newIndex: number) => Promise<void>;

    // Display Management
    addToDisplay: (entryId: string) => Promise<void>;
    removeFromDisplay: (entryId: string) => Promise<void>;
    toggleVisibility: (entryId: string) => Promise<void>;
}

// Store instance for imperative access
export const useContentEntryStore = create<ContentEntryStore>((set, get) => ({
    entries: [],
    pageId: null,
    newlyCreatedIds: new Set<string>(),
    previewVersion: 0,

    // 초기화 메서드 (Store 내부)
    initialize: (data) => {
        set({
            entries: data.entries,
            pageId: data.pageId,
            previewVersion: 0,
            newlyCreatedIds: new Set<string>(),
        });
    },

    // Setters
    setEntries: (entries) => set({ entries }),
    setPageId: (pageId) => set({ pageId }),

    setDisplayedEntries: (displayedEntries) => {
        set((state) => ({
            entries: state.entries.map((entry) => {
                const displayed = displayedEntries.find((d) => d.id === entry.id);
                return displayed ?? entry;
            }),
        }));
    },

    // Getters
    getEntryById: (id) => get().entries.find((e) => e.id === id),

    getDisplayedEntries: () =>
        get()
            .entries.filter((e) => typeof e.displayOrder === 'number')
            .sort((a, b) => a.displayOrder! - b.displayOrder!),

    getVisibleOnPageEntries: () =>
        get()
            .entries.filter((e) => typeof e.displayOrder === 'number' && e.isVisible)
            .sort((a, b) => a.displayOrder! - b.displayOrder!),

    isNewlyCreated: (id) => get().newlyCreatedIds.has(id),

    triggerPreviewRefresh: () => set((state) => ({ previewVersion: state.previewVersion + 1 })),

    // ============================================
    // Create Entry
    // ============================================
    createEntry: async (entry, publishOption = 'private') => {
        const { entries, pageId, newlyCreatedIds } = get();

        // pageId 검증
        if (!pageId) {
            console.error('createEntry 실패: pageId가 설정되지 않았습니다.');
            throw new Error('Page ID is not set. Please refresh the page.');
        }

        // 롤백용 이전 상태 저장
        const previousState = { entries, newlyCreatedIds };

        // 낙관적 업데이트: 엔트리 추가 + newlyCreatedIds에 등록
        const updatedNewlyCreatedIds = new Set(newlyCreatedIds);
        updatedNewlyCreatedIds.add(entry.id);

        set({
            entries: [...entries, entry],
            newlyCreatedIds: updatedNewlyCreatedIds,
        });

        const result = await apiFetch<{ id: string }>('/api/entries', {
            method: 'POST',
            body: { pageId, entry, publishOption },
        });

        if (!result.success) {
            // 롤백
            set(previousState);
            return { success: false, error: result.error };
        }

        return { success: true, data: entry.id };
    },

    /**
     * 기존 엔트리 수정
     * - DB에 PATCH
     * - 필드 레벨로 미리보기 트리거 여부 결정
     * @returns { success, triggeredPreview } - 호출부에서 DisplayEntryStore 트리거 결정용
     */
    updateEntry: async (entry) => {
        const { entries } = get();
        const existingIndex = entries.findIndex((e) => e.id === entry.id);

        if (existingIndex === -1) {
            console.error('수정할 엔트리를 찾을 수 없음:', entry.id);
            return { success: false, triggeredPreview: false };
        }

        const previousEntry = entries[existingIndex];
        const updatedEntries = entries.map((e) => (e.id === entry.id ? entry : e));

        // 필드 단위로 미리보기 트리거 여부 결정
        const triggeredPreview = shouldTriggerPreview(previousEntry, entry);

        // 낙관적 업데이트
        set({ entries: updatedEntries });

        const result = await apiFetch(`/api/entries/${entry.id}`, {
            method: 'PATCH',
            body: { entry },
        });

        if (!result.success) {
            // 롤백
            set({
                entries: entries.map((e) => (e.id === entry.id ? previousEntry : e)),
            });
            console.error('엔트리 수정 실패');
            return { success: false, triggeredPreview: false };
        }

        return { success: true, triggeredPreview };
    },

    /**
     * 엔트리 삭제
     * - 완성된 엔트리였다면 미리보기 트리거
     * @returns { success, triggeredPreview }
     */
    deleteEntry: async (id) => {
        const { entries, newlyCreatedIds } = get();
        const deletedEntry = entries.find((e) => e.id === id);

        if (!deletedEntry) {
            return { success: false, triggeredPreview: false };
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

        const result = await apiFetch(`/api/entries/${id}`, {
            method: 'DELETE',
        });

        if (!result.success) {
            // 롤백
            set({ entries, newlyCreatedIds });
            console.error('엔트리 삭제 실패');
            return { success: false, triggeredPreview: false };
        }

        return { success: true, triggeredPreview };
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

        const updates = reorderedSection.map((entry, index) => ({
            id: entry.id,
            position: index,
        }));

        const result = await apiFetch('/api/entries/reorder', {
            method: 'PATCH',
            body: { updates },
        });

        if (!result.success) {
            set({ entries: previousEntries });
            console.error('엔트리 순서 변경 실패');
        }
    },

    /**
     * Page에 추가 (displayOrder 설정)
     */
    addToDisplay: async (entryId) => {
        const { entries } = get();
        const previousEntries = entries;
        const targetEntry = entries.find((e) => e.id === entryId);

        if (!targetEntry || isDisplayed(targetEntry)) return;

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

        const result = await apiFetch(`/api/entries/${entryId}`, {
            method: 'PATCH',
            body: { displayOrder: newDisplayOrder, isVisible: true },
        });

        if (!result.success) {
            set({ entries: previousEntries });
            console.error('Display 추가 실패');
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

        const result = await apiFetch(`/api/entries/${entryId}`, {
            method: 'PATCH',
            body: { displayOrder: null },
        });

        if (!result.success) {
            set({ entries: previousEntries });
            console.error('Display 제거 실패:', result.error);
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

        const result = await apiFetch('/api/entries/reorder-display', {
            method: 'PATCH',
            body: { updates },
        });

        if (!result.success) {
            set({ entries: previousEntries });
            console.error('Display 순서 변경 실패');
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

        const result = await apiFetch(`/api/entries/${entryId}`, {
            method: 'PATCH',
            body: { isVisible: !targetEntry.isVisible },
        });

        if (!result.success) {
            set({ entries: previousEntries });
            console.error('Visibility 변경 실패');
        }
    },
}));

// Imperative access for initialization
export const initializeContentEntryStore = ({
    entries,
    pageId,
}: {
    entries: ContentEntry[];
    pageId: string;
}) => {
    useContentEntryStore.getState().initialize({ entries, pageId });
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
