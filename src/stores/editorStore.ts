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
export type ActivePanel = 'component' | 'page';

interface EditorStore {
    // 기존 상태
    user: User | null;
    components: ComponentData[];
    pageId: string | null;

    // 신규 상태 - 선택 및 편집
    selectedComponentId: string | null;
    editMode: EditMode;
    activePanel: ActivePanel;

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
    setActivePanel: (panel: ActivePanel) => void;

    // 신규 액션 - 사이드바
    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;

    // 신규 액션 - View (API 연동)
    setViewItems: (items: ViewItem[]) => void;
    addToView: (componentId: string, position?: number) => Promise<void>;
    removeFromView: (viewItemId: string) => Promise<void>;
    reorderView: (viewItemId: string, newPosition: number) => Promise<void>;
    toggleViewItemVisibility: (viewItemId: string) => Promise<void>;

    // 섹션 내 순서 변경
    reorderSectionItems: (
        type: 'show' | 'mixset' | 'link',
        componentId: string,
        newPosition: number
    ) => Promise<void>;

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
    activePanel: 'component',
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
            activePanel: 'component', // 컴포넌트 선택 시 component 패널로 전환
        }),

    setEditMode: (mode) => set({ editMode: mode }),

    setActivePanel: (panel) =>
        set({
            activePanel: panel,
            selectedComponentId: panel === 'page' ? null : get().selectedComponentId,
        }),

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

    // 신규 액션 - View (API 연동)
    setViewItems: (items) => set({ viewItems: items }),

    addToView: async (componentId, position) => {
        const state = get();
        const { pageId, viewItems } = state;

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
        const newItem: ViewItem = {
            id: tempId,
            componentId,
            order: orderIndex,
            isVisible: true,
        };

        let newItems: ViewItem[];
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

        // 낙관적 업데이트
        set({ viewItems: newItems });

        try {
            const response = await fetch('/api/view-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, componentId, orderIndex }),
            });

            if (!response.ok) {
                // 실패 시 롤백
                set({ viewItems });
                console.error('View item 추가 실패');
                return;
            }

            const result = await response.json();

            // 서버에서 받은 실제 ID로 업데이트
            set((s) => ({
                viewItems: s.viewItems.map((item) =>
                    item.id === tempId
                        ? {
                              ...item,
                              id: result.data.id,
                          }
                        : item
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
            // 실패 시 롤백
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
        set({ viewItems: newItems });

        try {
            const response = await fetch(`/api/view-items/${viewItemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // 실패 시 롤백
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
            // 실패 시 롤백
            set({ viewItems: previousItems });
            console.error('View item 삭제 오류:', error);
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
                // 실패 시 롤백
                set({ viewItems: previousItems });
                console.error('View item 순서 변경 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            set({ viewItems: previousItems });
            console.error('View item 순서 변경 오류:', error);
        }
    },

    toggleViewItemVisibility: async (viewItemId) => {
        const { viewItems } = get();
        const previousItems = viewItems;
        const targetItem = viewItems.find((item) => item.id === viewItemId);

        if (!targetItem) return;

        // 낙관적 업데이트
        set({
            viewItems: viewItems.map((item) =>
                item.id === viewItemId ? { ...item, isVisible: !item.isVisible } : item
            ),
        });

        try {
            const response = await fetch(`/api/view-items/${viewItemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !targetItem.isVisible }),
            });

            if (!response.ok) {
                // 실패 시 롤백
                set({ viewItems: previousItems });
                console.error('View item 표시 여부 변경 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            set({ viewItems: previousItems });
            console.error('View item 표시 여부 변경 오류:', error);
        }
    },

    // 섹션 내 컴포넌트 순서 변경
    reorderSectionItems: async (type, componentId, newPosition) => {
        const { components } = get();
        const previousComponents = components;

        // 해당 타입의 컴포넌트만 필터링
        const sectionComponents = components.filter((c) => c.type === type);
        const otherComponents = components.filter((c) => c.type !== type);

        const currentIndex = sectionComponents.findIndex((c) => c.id === componentId);
        if (currentIndex === -1) return;

        // 순서 변경
        const reorderedSection = [...sectionComponents];
        const [movedComponent] = reorderedSection.splice(currentIndex, 1);
        reorderedSection.splice(newPosition, 0, movedComponent);

        // 전체 컴포넌트 목록 재구성 (position 재할당)
        const allComponents = [...otherComponents, ...reorderedSection];

        // 낙관적 업데이트
        set({ components: allComponents });

        try {
            // position 업데이트 배열 생성
            const updates = reorderedSection.map((comp, index) => ({
                id: comp.id,
                position: index,
            }));

            const response = await fetch('/api/components/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                // 실패 시 롤백
                set({ components: previousComponents });
                console.error('컴포넌트 순서 변경 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            set({ components: previousComponents });
            console.error('컴포넌트 순서 변경 오류:', error);
        }
    },

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
