import { create } from 'zustand';

// 사이드바 섹션 상태 타입
export interface SidebarSectionState {
    collapsed: boolean;
}

export type SidebarSections = {
    page: SidebarSectionState;
    events: SidebarSectionState;
    mixsets: SidebarSectionState;
    links: SidebarSectionState;
};

export type SectionKey = keyof SidebarSections;
export type ActivePanel = 'entry' | 'bio' | 'page';

interface UIStore {
    selectedEntryId: string | null;
    activePanel: ActivePanel;
    isCreating: boolean;
    sidebarSections: SidebarSections; // 사이드바 상태

    selectEntry: (id: string | null) => void;
    setActivePanel: (panel: ActivePanel) => void;
    startCreating: (entryId: string) => void;
    finishCreating: () => void;

    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;
}

const initialSidebarSections: SidebarSections = {
    page: { collapsed: true },
    events: { collapsed: true },
    mixsets: { collapsed: true },
    links: { collapsed: true },
};

export const useUIStore = create<UIStore>((set, get) => ({
    selectedEntryId: 'page',
    activePanel: 'page',
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

/** @deprecated EditMode is no longer used - inline editing doesn't need separate modes */
export type EditMode = 'view' | 'edit';
