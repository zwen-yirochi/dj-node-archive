/**
 * contentEntryStore.ts - 콘텐츠 엔트리 상태 관리
 *
 * 콘텐츠 엔트리 데이터를 관리합니다.
 * previewVersion은 DisplayEntryStore로 이동됨.
 */

import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import type { ContentEntry, Theme } from '@/types';
import { create } from 'zustand';

// ============================================
// Content Entry Store Interface
// ============================================
interface ContentEntryStore {
    entries: ContentEntry[];
    pageId: string | null;
    theme: Theme | null;

    // 새로 생성된 엔트리 ID 추적 (isCreating 파생용)
    newlyCreatedIds: Set<string>;

    // Setters
    setEntries: (entries: ContentEntry[]) => void;
    setPageId: (pageId: string) => void;
    setTheme: (theme: Theme) => void;

    // 엔트리 관련 유틸리티
    getEntryById: (id: string) => ContentEntry | undefined;
    isNewlyCreated: (id: string) => boolean;

    // 엔트리 CRUD 액션 (분리됨)
    /** 새 엔트리 생성 - DB 저장 후 ID 반환, 미리보기 트리거 안 함 */
    createEntry: (entry: ContentEntry) => Promise<string>;
    /** 기존 엔트리 수정 - 미리보기 트리거 여부 반환 */
    updateEntry: (entry: ContentEntry) => Promise<{ triggeredPreview: boolean }>;
    /** 엔트리 삭제 - 미리보기 트리거 여부 반환 */
    deleteEntry: (id: string) => Promise<{ triggeredPreview: boolean }>;

    // 생성 완료 처리 (newlyCreatedIds에서 제거)
    finishCreating: (id: string) => void;

    // 섹션 내 순서 변경 (미리보기 트리거 안함)
    reorderSectionItems: (
        type: 'event' | 'mixset' | 'link',
        entryId: string,
        newPosition: number
    ) => Promise<void>;
}

// ============================================
// Content Entry Store Implementation
// ============================================
export const useContentEntryStore = create<ContentEntryStore>((set, get) => ({
    entries: [],
    pageId: null,
    theme: null,
    newlyCreatedIds: new Set<string>(),

    setEntries: (entries) => set({ entries }),
    setPageId: (pageId) => set({ pageId }),
    setTheme: (theme) => set({ theme }),

    getEntryById: (id) => {
        return get().entries.find((e) => e.id === id);
    },

    isNewlyCreated: (id) => {
        return get().newlyCreatedIds.has(id);
    },

    /**
     * 새 엔트리 생성
     * - DB에 POST
     * - newlyCreatedIds에 추가 (isCreating 파생용)
     * - 미리보기 트리거 안 함 (생성 중에는 불완전한 상태)
     */
    createEntry: async (entry) => {
        const { entries, pageId, newlyCreatedIds } = get();

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
                body: JSON.stringify({ pageId, entry }),
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
     * - UIStore의 isCreating 대신 이 상태로 파생
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

        const sectionEntries = entries.filter((e) => e.type === type);
        const otherEntries = entries.filter((e) => e.type !== type);

        const currentIndex = sectionEntries.findIndex((e) => e.id === entryId);
        if (currentIndex === -1) return;

        const reorderedSection = [...sectionEntries];
        const [movedEntry] = reorderedSection.splice(currentIndex, 1);
        reorderedSection.splice(newPosition, 0, movedEntry);

        const allEntries = [...otherEntries, ...reorderedSection];
        set({ entries: allEntries });

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
}));

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
