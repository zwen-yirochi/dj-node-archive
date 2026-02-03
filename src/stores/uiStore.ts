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
export type EditMode = 'view' | 'edit';
export type ActivePanel = 'component' | 'bio' | 'page';

interface UIStore {
    // 선택 및 편집 상태
    selectedComponentId: string | null;
    editMode: EditMode;
    activePanel: ActivePanel;
    /** 새 컴포넌트 생성 중인지 여부 */
    isCreating: boolean;

    // 사이드바 상태
    sidebarSections: SidebarSections;

    // 선택 및 편집 액션
    selectComponent: (id: string | null) => void;
    setEditMode: (mode: EditMode) => void;
    setActivePanel: (panel: ActivePanel) => void;
    /** 생성 모드 시작 (컴포넌트 선택 + 생성 플래그) */
    startCreating: (componentId: string) => void;
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
    selectedComponentId: null,
    editMode: 'view',
    activePanel: 'component',
    isCreating: false,
    sidebarSections: initialSidebarSections,

    // 선택 및 편집 액션
    selectComponent: (id) =>
        set({
            selectedComponentId: id,
            editMode: 'view', // 선택 시 항상 view 모드로 시작
            activePanel: 'component', // 컴포넌트 선택 시 component 패널로 전환
            isCreating: false, // 다른 컴포넌트 선택 시 생성 모드 해제
        }),

    setEditMode: (mode) => set({ editMode: mode }),

    setActivePanel: (panel) =>
        set({
            activePanel: panel,
            selectedComponentId: panel === 'page' ? null : get().selectedComponentId,
            isCreating: false,
        }),

    startCreating: (componentId) =>
        set({
            selectedComponentId: componentId,
            editMode: 'edit',
            activePanel: 'component',
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
