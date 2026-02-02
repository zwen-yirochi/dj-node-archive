import type { ComponentData, User } from '@/types';
import { create } from 'zustand';

// View 항목 타입
export interface ViewItem {
    id: string;
    componentId: string;
    order: number;
    isVisible: boolean;
}

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

interface EditorStore {
    // 기존 상태
    user: User | null;
    components: ComponentData[];
    pageId: string | null;

    // 신규 상태 - 선택 및 편집
    selectedComponentId: string | null;
    editMode: EditMode;

    // 신규 상태 - 사이드바
    sidebarSections: SidebarSections;

    // 신규 상태 - View (공개 페이지 배치)
    viewItems: ViewItem[];

    // 기존 액션
    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;
    setComponents: (components: ComponentData[]) => void;
    setPageId: (pageId: string) => void;

    // 신규 액션 - 선택 및 편집
    selectComponent: (id: string | null) => void;
    setEditMode: (mode: EditMode) => void;

    // 신규 액션 - 사이드바
    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;

    // 신규 액션 - View
    setViewItems: (items: ViewItem[]) => void;
    addToView: (componentId: string, position?: number) => void;
    removeFromView: (viewItemId: string) => void;
    reorderView: (viewItemId: string, newPosition: number) => void;
    toggleViewItemVisibility: (viewItemId: string) => void;

    // 유틸리티
    getComponentById: (id: string) => ComponentData | undefined;
    getSelectedComponent: () => ComponentData | undefined;
    isInView: (componentId: string) => boolean;
}

const initialSidebarSections: SidebarSections = {
    view: { collapsed: false },
    events: { collapsed: false },
    mixsets: { collapsed: false },
    links: { collapsed: false },
};

export const useEditorStore = create<EditorStore>((set, get) => ({
    // 기존 상태 초기값
    user: null,
    components: [],
    pageId: null,

    // 신규 상태 초기값
    selectedComponentId: null,
    editMode: 'view',
    sidebarSections: initialSidebarSections,
    viewItems: [],

    // 기존 액션
    setUser: (user) => set({ user }),

    updateUser: (updates) =>
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
        })),

    setComponents: (components) => set({ components }),

    setPageId: (pageId) => set({ pageId }),

    // 신규 액션 - 선택 및 편집
    selectComponent: (id) =>
        set({
            selectedComponentId: id,
            editMode: 'view', // 선택 시 항상 view 모드로 시작
        }),

    setEditMode: (mode) => set({ editMode: mode }),

    // 신규 액션 - 사이드바
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

    // 신규 액션 - View
    setViewItems: (items) => set({ viewItems: items }),

    addToView: (componentId, position) =>
        set((state) => {
            // 이미 View에 있으면 추가하지 않음
            if (state.viewItems.some((item) => item.componentId === componentId)) {
                return state;
            }

            const newItem: ViewItem = {
                id: crypto.randomUUID(),
                componentId,
                order: position ?? state.viewItems.length,
                isVisible: true,
            };

            let newItems: ViewItem[];
            if (position !== undefined) {
                // 특정 위치에 삽입
                newItems = [...state.viewItems];
                newItems.splice(position, 0, newItem);
                // order 재정렬
                newItems = newItems.map((item, index) => ({
                    ...item,
                    order: index,
                }));
            } else {
                // 맨 뒤에 추가
                newItems = [...state.viewItems, newItem];
            }

            return { viewItems: newItems };
        }),

    removeFromView: (viewItemId) =>
        set((state) => {
            const newItems = state.viewItems
                .filter((item) => item.id !== viewItemId)
                .map((item, index) => ({ ...item, order: index }));
            return { viewItems: newItems };
        }),

    reorderView: (viewItemId, newPosition) =>
        set((state) => {
            const currentIndex = state.viewItems.findIndex((item) => item.id === viewItemId);
            if (currentIndex === -1) return state;

            const newItems = [...state.viewItems];
            const [movedItem] = newItems.splice(currentIndex, 1);
            newItems.splice(newPosition, 0, movedItem);

            // order 재정렬
            return {
                viewItems: newItems.map((item, index) => ({
                    ...item,
                    order: index,
                })),
            };
        }),

    toggleViewItemVisibility: (viewItemId) =>
        set((state) => ({
            viewItems: state.viewItems.map((item) =>
                item.id === viewItemId ? { ...item, isVisible: !item.isVisible } : item
            ),
        })),

    // 유틸리티
    getComponentById: (id) => {
        return get().components.find((c) => c.id === id);
    },

    getSelectedComponent: () => {
        const { selectedComponentId, components } = get();
        if (!selectedComponentId) return undefined;
        return components.find((c) => c.id === selectedComponentId);
    },

    isInView: (componentId) => {
        return get().viewItems.some((item) => item.componentId === componentId);
    },
}));

// 유틸리티 함수: 컴포넌트 내에서 useMemo와 함께 사용
export const getComponentsByType = (
    components: ComponentData[],
    type: 'show' | 'mixset' | 'link'
) => components.filter((c) => c.type === type);

export const getSelectedComponent = (
    components: ComponentData[],
    selectedComponentId: string | null
) => {
    if (!selectedComponentId) return null;
    return components.find((c) => c.id === selectedComponentId) ?? null;
};
