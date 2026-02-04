/**
 * componentStore.ts - 컴포넌트 상태 관리
 *
 * 컴포넌트 데이터와 미리보기 트리거를 관리합니다.
 */

import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import type { ComponentData, Theme } from '@/types';
import { create } from 'zustand';

// ============================================
// Component Store
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
            const updatedComponents = components.map((c) =>
                c.id === component.id ? component : c
            );

            // 필드 단위로 미리보기 트리거 여부 결정
            // - 공개 페이지에 렌더링되는 필드(triggersPreview: true)가 변경된 경우에만 트리거
            // - description, links 등 미표시 필드는 트리거하지 않음
            const needsPreviewRefresh = shouldTriggerPreview(previousComponent, component);

            set({
                components: updatedComponents,
                ...(needsPreviewRefresh && { previewVersion: previewVersion + 1 }),
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
// Utility Functions
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
