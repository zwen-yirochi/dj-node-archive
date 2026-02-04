/**
 * componentStore.ts - 컴포넌트 상태 관리
 *
 * 컴포넌트 데이터를 관리합니다.
 * previewVersion은 ViewStore로 이동됨.
 */

import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import type { ComponentData, Theme } from '@/types';
import { create } from 'zustand';

// ============================================
// Component Store Interface
// ============================================
interface ComponentStore {
    components: ComponentData[];
    pageId: string | null;
    theme: Theme | null;

    // 새로 생성된 컴포넌트 ID 추적 (isCreating 파생용)
    newlyCreatedIds: Set<string>;

    // Setters
    setComponents: (components: ComponentData[]) => void;
    setPageId: (pageId: string) => void;
    setTheme: (theme: Theme) => void;

    // 컴포넌트 관련 유틸리티
    getComponentById: (id: string) => ComponentData | undefined;
    isNewlyCreated: (id: string) => boolean;

    // 컴포넌트 CRUD 액션 (분리됨)
    /** 새 컴포넌트 생성 - DB 저장 후 ID 반환, 미리보기 트리거 안 함 */
    createComponent: (component: ComponentData) => Promise<string>;
    /** 기존 컴포넌트 수정 - 미리보기 트리거 여부 반환 */
    updateComponent: (component: ComponentData) => Promise<{ triggeredPreview: boolean }>;
    /** 컴포넌트 삭제 - 미리보기 트리거 여부 반환 */
    deleteComponent: (id: string) => Promise<{ triggeredPreview: boolean }>;

    // 생성 완료 처리 (newlyCreatedIds에서 제거)
    finishCreating: (id: string) => void;

    // 섹션 내 순서 변경 (미리보기 트리거 안함)
    reorderSectionItems: (
        type: 'event' | 'mixset' | 'link',
        componentId: string,
        newPosition: number
    ) => Promise<void>;
}

// ============================================
// Component Store Implementation
// ============================================
export const useComponentStore = create<ComponentStore>((set, get) => ({
    components: [],
    pageId: null,
    theme: null,
    newlyCreatedIds: new Set<string>(),

    setComponents: (components) => set({ components }),
    setPageId: (pageId) => set({ pageId }),
    setTheme: (theme) => set({ theme }),

    getComponentById: (id) => {
        return get().components.find((c) => c.id === id);
    },

    isNewlyCreated: (id) => {
        return get().newlyCreatedIds.has(id);
    },

    /**
     * 새 컴포넌트 생성
     * - DB에 POST
     * - newlyCreatedIds에 추가 (isCreating 파생용)
     * - 미리보기 트리거 안 함 (생성 중에는 불완전한 상태)
     */
    createComponent: async (component) => {
        const { components, pageId, newlyCreatedIds } = get();

        // 낙관적 업데이트: 컴포넌트 추가 + newlyCreatedIds에 등록
        const updatedComponents = [...components, component];
        const updatedNewlyCreatedIds = new Set(newlyCreatedIds);
        updatedNewlyCreatedIds.add(component.id);

        set({
            components: updatedComponents,
            newlyCreatedIds: updatedNewlyCreatedIds,
        });

        try {
            const response = await fetch('/api/components', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, component }),
            });

            if (!response.ok) {
                // 롤백
                set({ components, newlyCreatedIds });
                console.error('컴포넌트 생성 실패');
                throw new Error('컴포넌트 생성 실패');
            }

            return component.id;
        } catch (error) {
            // 롤백
            set({ components, newlyCreatedIds });
            console.error('컴포넌트 생성 오류:', error);
            throw error;
        }
    },

    /**
     * 기존 컴포넌트 수정
     * - DB에 PATCH
     * - 필드 레벨로 미리보기 트리거 여부 결정
     * @returns { triggeredPreview: boolean } - 호출부에서 ViewStore 트리거 결정용
     */
    updateComponent: async (component) => {
        const { components } = get();
        const existingIndex = components.findIndex((c) => c.id === component.id);

        if (existingIndex === -1) {
            console.error('수정할 컴포넌트를 찾을 수 없음:', component.id);
            return { triggeredPreview: false };
        }

        const previousComponent = components[existingIndex];
        const updatedComponents = components.map((c) => (c.id === component.id ? component : c));

        // 필드 단위로 미리보기 트리거 여부 결정
        const triggeredPreview = shouldTriggerPreview(previousComponent, component);

        // 낙관적 업데이트
        set({ components: updatedComponents });

        try {
            const response = await fetch(`/api/components/${component.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ component }),
            });

            if (!response.ok) {
                // 롤백
                set({
                    components: components.map((c) =>
                        c.id === component.id ? previousComponent : c
                    ),
                });
                console.error('컴포넌트 수정 실패');
                return { triggeredPreview: false };
            }

            return { triggeredPreview };
        } catch (error) {
            // 롤백
            set({
                components: components.map((c) => (c.id === component.id ? previousComponent : c)),
            });
            console.error('컴포넌트 수정 오류:', error);
            return { triggeredPreview: false };
        }
    },

    /**
     * 컴포넌트 삭제
     * - 완성된 컴포넌트였다면 미리보기 트리거
     * @returns { triggeredPreview: boolean }
     */
    deleteComponent: async (id) => {
        const { components, newlyCreatedIds } = get();
        const deletedComponent = components.find((c) => c.id === id);

        if (!deletedComponent) {
            return { triggeredPreview: false };
        }

        // 삭제된 컴포넌트가 완성된 상태였다면 미리보기 새로고침 필요
        const triggeredPreview = canAddToView(deletedComponent);

        // newlyCreatedIds에서도 제거
        const updatedNewlyCreatedIds = new Set(newlyCreatedIds);
        updatedNewlyCreatedIds.delete(id);

        // 낙관적 업데이트
        set({
            components: components.filter((c) => c.id !== id),
            newlyCreatedIds: updatedNewlyCreatedIds,
        });

        try {
            const response = await fetch(`/api/components/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // 롤백
                set({ components, newlyCreatedIds });
                console.error('컴포넌트 삭제 실패');
                return { triggeredPreview: false };
            }

            return { triggeredPreview };
        } catch (error) {
            // 롤백
            set({ components, newlyCreatedIds });
            console.error('컴포넌트 삭제 오류:', error);
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
    type: 'event' | 'mixset' | 'link'
) => components.filter((c) => c.type === type);

export const getSelectedComponent = (
    components: ComponentData[],
    selectedComponentId: string | null
) => {
    if (!selectedComponentId) return null;
    return components.find((c) => c.id === selectedComponentId) ?? null;
};
