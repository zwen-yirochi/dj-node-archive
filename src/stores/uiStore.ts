import { create } from 'zustand';

// 사이드바 섹션 상태 타입
export interface SidebarSectionState {
    collapsed: boolean;
}

export type SidebarSections = {
    view: SidebarSectionState;
    events: SidebarSectionState;
    mixsets: SidebarSectionState;
    links: SidebarSectionState;
};

export type SectionKey = keyof SidebarSections;
export type ActivePanel = 'entry' | 'bio' | 'page';

interface UIStore {
    // 선택 및 편집 상태
    selectedEntryId: string | null;
    activePanel: ActivePanel;
    /** 새 엔트리 생성 중인지 여부 */
    isCreating: boolean;

    // 사이드바 상태
    sidebarSections: SidebarSections;

    // 선택 및 편집 액션
    selectEntry: (id: string | null) => void;
    setActivePanel: (panel: ActivePanel) => void;
    /** 생성 모드 시작 (엔트리 선택 + 생성 플래그) */
    startCreating: (entryId: string) => void;
    /** 생성 완료 (플래그 해제) */
    finishCreating: () => void;

    // 사이드바 액션
    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;
}

const initialSidebarSections: SidebarSections = {
    view: { collapsed: false },
    events: { collapsed: false },
    mixsets: { collapsed: false },
    links: { collapsed: false },
};

export const useUIStore = create<UIStore>((set, get) => ({
    // 초기 상태
    selectedEntryId: null,
    activePanel: 'entry',
    isCreating: false,
    sidebarSections: initialSidebarSections,

    // 선택 및 편집 액션
    selectEntry: (id) =>
        set({
            selectedEntryId: id,
            activePanel: 'entry', // 엔트리 선택 시 entry 패널로 전환
            isCreating: false, // 다른 엔트리 선택 시 생성 모드 해제
        }),

    setActivePanel: (panel) =>
        set({
            activePanel: panel,
            selectedEntryId: panel === 'page' ? null : get().selectedEntryId,
            isCreating: false,
        }),

    startCreating: (entryId) =>
        set({
            selectedEntryId: entryId,
            activePanel: 'entry',
            isCreating: true,
        }),

    finishCreating: () => set({ isCreating: false }),

    // 사이드바 액션
    toggleSection: (section) =>
        set((state) => ({
            sidebarSections: {
                ...state.sidebarSections,
                [section]: {
                    collapsed: !state.sidebarSections[section].collapsed,
                },
            },
        })),

    setSectionCollapsed: (section, collapsed) =>
        set((state) => ({
            sidebarSections: {
                ...state.sidebarSections,
                [section]: { collapsed },
            },
        })),
}));

// ============================================
// Deprecated Aliases (호환성 유지)
// ============================================

/** @deprecated EditMode is no longer used - inline editing doesn't need separate modes */
export type EditMode = 'view' | 'edit';
