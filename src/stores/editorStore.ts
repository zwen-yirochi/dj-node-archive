/**
 * editorStore.ts - Facade Store
 *
 * 기존 코드와의 호환성을 위해 useEditorStore 인터페이스를 유지합니다.
 * 내부적으로 분리된 store들(userStore, viewStore, uiStore)을 사용합니다.
 *
 * 새 코드에서는 개별 store를 직접 사용하는 것을 권장합니다:
 * - useUserStore: 사용자 정보
 * - useViewStore: View 아이템 관리
 * - useUIStore: UI 상태 (선택, 편집 모드, 사이드바 등)
 */

import { canAddToView } from '@/lib/validators';
import type { ComponentData, Theme, User } from '@/types';
import { create } from 'zustand';

// Re-export types from split stores for backward compatibility
export type { ViewItem } from './viewStore';
export type {
    ActivePanel,
    EditMode,
    SectionKey,
    SidebarSections,
    SidebarSectionState,
} from './uiStore';

// ============================================
// Component Store (핵심 데이터)
// ============================================
interface ComponentStore {
    components: ComponentData[];
    pageId: string | null;
    theme: Theme | null;

    // 미리보기 업데이트 트리거 (조건부 새로고침용)
    // 완성된 컴포넌트 변경, 삭제, visibility 변경 시에만 증가
    previewVersion: number;

    setComponents: (components: ComponentData[]) => void;
    setPageId: (pageId: string) => void;
    setTheme: (theme: Theme) => void;

    // 컴포넌트 관련 유틸리티
    getComponentById: (id: string) => ComponentData | undefined;

    // 컴포넌트 CRUD 액션
    saveComponent: (component: ComponentData) => Promise<void>;
    deleteComponent: (id: string) => Promise<void>;

    // 섹션 내 순서 변경 (미리보기 트리거 안함)
    reorderSectionItems: (
        type: 'show' | 'mixset' | 'link',
        componentId: string,
        newPosition: number
    ) => Promise<void>;

    // 수동 미리보기 새로고침 트리거
    triggerPreviewRefresh: () => void;
}

export const useComponentStore = create<ComponentStore>((set, get) => ({
    components: [],
    pageId: null,
    theme: null,
    previewVersion: 0,

    setComponents: (components) => set({ components }),
    setPageId: (pageId) => set({ pageId }),
    setTheme: (theme) => set({ theme }),

    triggerPreviewRefresh: () => set((state) => ({ previewVersion: state.previewVersion + 1 })),

    getComponentById: (id) => {
        return get().components.find((c) => c.id === id);
    },

    saveComponent: async (component) => {
        const { components, pageId, previewVersion } = get();
        const existingIndex = components.findIndex((c) => c.id === component.id);

        // 컴포넌트가 공개 가능한 상태인지 확인
        const isComplete = canAddToView(component);

        if (existingIndex === -1) {
            // 새 컴포넌트 추가
            const updatedComponents = [...components, component];
            // 완성된 컴포넌트만 미리보기 새로고침
            set({
                components: updatedComponents,
                ...(isComplete && { previewVersion: previewVersion + 1 }),
            });

            try {
                const response = await fetch('/api/components', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId, component }),
                });

                if (!response.ok) {
                    set({ components });
                    console.error('컴포넌트 추가 실패');
                }
            } catch (error) {
                set({ components });
                console.error('컴포넌트 추가 오류:', error);
            }
        } else {
            // 기존 컴포넌트 수정
            const previousComponent = components[existingIndex];
            const wasComplete = canAddToView(previousComponent);
            const updatedComponents = components.map((c) =>
                c.id === component.id ? component : c
            );

            // 완성된 상태에서 변경되었거나, 완성 상태로 전환된 경우에만 미리보기 새로고침
            const shouldRefreshPreview = isComplete || wasComplete;

            set({
                components: updatedComponents,
                ...(shouldRefreshPreview && { previewVersion: previewVersion + 1 }),
            });

            try {
                const response = await fetch(`/api/components/${component.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ component }),
                });

                if (!response.ok) {
                    set({
                        components: components.map((c) =>
                            c.id === component.id ? previousComponent : c
                        ),
                    });
                    console.error('컴포넌트 수정 실패');
                }
            } catch (error) {
                set({
                    components: components.map((c) =>
                        c.id === component.id ? previousComponent : c
                    ),
                });
                console.error('컴포넌트 수정 오류:', error);
            }
        }
    },

    deleteComponent: async (id) => {
        const { components, previewVersion } = get();
        const deletedComponent = components.find((c) => c.id === id);
        if (!deletedComponent) return;

        // 삭제된 컴포넌트가 완성된 상태였다면 미리보기 새로고침
        const wasComplete = canAddToView(deletedComponent);

        set({
            components: components.filter((c) => c.id !== id),
            ...(wasComplete && { previewVersion: previewVersion + 1 }),
        });

        try {
            const response = await fetch(`/api/components/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                set({ components });
                console.error('컴포넌트 삭제 실패');
            }
        } catch (error) {
            set({ components });
            console.error('컴포넌트 삭제 오류:', error);
        }
    },

    reorderSectionItems: async (type, componentId, newPosition) => {
        const { components } = get();
        const previousComponents = components;

        const sectionComponents = components.filter((c) => c.type === type);
        const otherComponents = components.filter((c) => c.type !== type);

        const currentIndex = sectionComponents.findIndex((c) => c.id === componentId);
        if (currentIndex === -1) return;

        const reorderedSection = [...sectionComponents];
        const [movedComponent] = reorderedSection.splice(currentIndex, 1);
        reorderedSection.splice(newPosition, 0, movedComponent);

        const allComponents = [...otherComponents, ...reorderedSection];
        set({ components: allComponents });

        try {
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
                set({ components: previousComponents });
                console.error('컴포넌트 순서 변경 실패');
            }
        } catch (error) {
            set({ components: previousComponents });
            console.error('컴포넌트 순서 변경 오류:', error);
        }
    },
}));

// ============================================
// Legacy Facade Store (호환성 유지)
// ============================================
import {
    type ActivePanel,
    type EditMode,
    type SectionKey,
    type SidebarSections,
    useUIStore,
} from './uiStore';
import { useUserStore } from './userStore';
import { type ViewItem, useViewStore } from './viewStore';

/**
 * @deprecated 새 코드에서는 개별 store 사용을 권장합니다.
 * - useUserStore, useViewStore, useUIStore, useComponentStore
 */
interface EditorStore {
    // User (from userStore)
    user: User | null;
    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;

    // Components (from componentStore)
    components: ComponentData[];
    pageId: string | null;
    theme: Theme | null;
    setComponents: (components: ComponentData[]) => void;
    setPageId: (pageId: string) => void;
    setTheme: (theme: Theme) => void;

    // UI State (from uiStore)
    selectedComponentId: string | null;
    editMode: EditMode;
    activePanel: ActivePanel;
    sidebarSections: SidebarSections;
    selectComponent: (id: string | null) => void;
    setEditMode: (mode: EditMode) => void;
    setActivePanel: (panel: ActivePanel) => void;
    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;

    // View Items (from viewStore)
    viewItems: ViewItem[];
    setViewItems: (items: ViewItem[]) => void;
    addToView: (componentId: string, position?: number) => Promise<void>;
    removeFromView: (viewItemId: string) => Promise<void>;
    reorderView: (viewItemId: string, newPosition: number) => Promise<void>;
    toggleViewItemVisibility: (viewItemId: string) => Promise<void>;

    // Component utilities
    reorderSectionItems: (
        type: 'show' | 'mixset' | 'link',
        componentId: string,
        newPosition: number
    ) => Promise<void>;
    getComponentById: (id: string) => ComponentData | undefined;
    getSelectedComponent: () => ComponentData | undefined;
    isInView: (componentId: string) => boolean;

    // Component CRUD
    saveComponent: (component: ComponentData) => Promise<void>;
    deleteComponent: (id: string) => Promise<void>;
}

/**
 * Legacy facade hook - 기존 코드 호환성을 위해 유지
 * @deprecated 새 코드에서는 개별 store 사용을 권장합니다.
 */
export const useEditorStore = <T>(selector: (state: EditorStore) => T): T => {
    // 각 store에서 상태 가져오기
    const userState = useUserStore();
    const componentState = useComponentStore();
    const uiState = useUIStore();
    const viewState = useViewStore();

    // 통합 상태 객체 생성
    const combinedState: EditorStore = {
        // User
        user: userState.user,
        setUser: userState.setUser,
        updateUser: userState.updateUser,

        // Components
        components: componentState.components,
        pageId: componentState.pageId,
        theme: componentState.theme,
        setComponents: componentState.setComponents,
        setPageId: componentState.setPageId,
        setTheme: componentState.setTheme,

        // UI
        selectedComponentId: uiState.selectedComponentId,
        editMode: uiState.editMode,
        activePanel: uiState.activePanel,
        sidebarSections: uiState.sidebarSections,
        selectComponent: uiState.selectComponent,
        setEditMode: uiState.setEditMode,
        setActivePanel: uiState.setActivePanel,
        toggleSection: uiState.toggleSection,
        setSectionCollapsed: uiState.setSectionCollapsed,

        // View Items
        viewItems: viewState.viewItems,
        setViewItems: viewState.setViewItems,
        addToView: (componentId, position) => {
            const pageId = componentState.pageId;
            if (!pageId) {
                console.error('pageId가 없습니다.');
                return Promise.resolve();
            }
            return viewState.addToView(pageId, componentId, position);
        },
        removeFromView: viewState.removeFromView,
        reorderView: viewState.reorderView,
        toggleViewItemVisibility: viewState.toggleViewItemVisibility,

        // Utilities
        reorderSectionItems: componentState.reorderSectionItems,
        getComponentById: componentState.getComponentById,
        getSelectedComponent: () => {
            if (!uiState.selectedComponentId) return undefined;
            return componentState.components.find((c) => c.id === uiState.selectedComponentId);
        },
        isInView: viewState.isInView,

        // Component CRUD
        saveComponent: componentState.saveComponent,
        deleteComponent: componentState.deleteComponent,
    };

    return selector(combinedState);
};

// ============================================
// Utility Functions (유지)
// ============================================

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
