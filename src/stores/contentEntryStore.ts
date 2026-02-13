// stores/contentEntryStore.ts
/**
 * Dashboard UI Store (contentEntryStore)
 *
 * 순수 UI 상태만 관리합니다.
 * 서버 상태(entries, CRUD)는 TanStack Query (use-entries.ts)로 이관되었습니다.
 *
 * 담당:
 * - previewVersion: 미리보기 iframe 새로고침 트리거 (순수 UI 시그널)
 * - newlyCreatedIds: 생성 직후 UI 상태 (애니메이션 등)
 */

import { create } from 'zustand';

interface DashboardUIState {
    newlyCreatedIds: Set<string>;
    previewVersion: number;

    triggerPreviewRefresh: () => void;
    addNewlyCreated: (id: string) => void;
    isNewlyCreated: (id: string) => boolean;
    finishCreating: (id: string) => void;
    reset: () => void;
}

export const useDashboardUIStore = create<DashboardUIState>((set, get) => ({
    newlyCreatedIds: new Set<string>(),
    previewVersion: 0,

    triggerPreviewRefresh: () => set((state) => ({ previewVersion: state.previewVersion + 1 })),

    addNewlyCreated: (id) => {
        const updated = new Set(get().newlyCreatedIds);
        updated.add(id);
        set({ newlyCreatedIds: updated });
    },

    isNewlyCreated: (id) => get().newlyCreatedIds.has(id),

    finishCreating: (id) => {
        const updated = new Set(get().newlyCreatedIds);
        updated.delete(id);
        set({ newlyCreatedIds: updated });
    },

    reset: () =>
        set({
            newlyCreatedIds: new Set<string>(),
            previewVersion: 0,
        }),
}));

// Legacy alias for backward compatibility during migration
export const useContentEntryStore = useDashboardUIStore;
