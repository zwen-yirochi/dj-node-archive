'use client';

import { useComponentStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { useMemo } from 'react';
import BioDesignPanel from './BioDesignPanel';
import CreateMode from './EditMode/CreateMode';
import EmptyState from './EmptyState';
import InlineEditMode from './InlineEditMode';
import PageListView from './PageListView';

export default function ContentPanel() {
    // UI Store
    const selectedComponentId = useUIStore((state) => state.selectedComponentId);
    const activePanel = useUIStore((state) => state.activePanel);
    const isCreating = useUIStore((state) => state.isCreating);
    const selectComponent = useUIStore((state) => state.selectComponent);
    const finishCreating = useUIStore((state) => state.finishCreating);

    // Component Store
    const components = useComponentStore((state) => state.components);
    const saveComponent = useComponentStore((state) => state.saveComponent);
    const deleteComponent = useComponentStore((state) => state.deleteComponent);

    // useMemo로 선택된 컴포넌트 찾기
    const selectedComponent = useMemo(() => {
        if (!selectedComponentId) return null;
        return components.find((c) => c.id === selectedComponentId) ?? null;
    }, [selectedComponentId, components]);

    // Bio design 패널 모드
    if (activePanel === 'bio') {
        return (
            <div className="h-full overflow-hidden rounded-2xl">
                <BioDesignPanel />
            </div>
        );
    }

    // Page 패널 모드
    if (activePanel === 'page') {
        return (
            <div className="h-full overflow-hidden rounded-2xl">
                <PageListView />
            </div>
        );
    }

    // 선택된 컴포넌트가 없으면 EmptyState
    if (!selectedComponent) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl">
                <EmptyState />
            </div>
        );
    }

    // 생성 모드 (새 컴포넌트) - 별도 유지
    if (isCreating) {
        return (
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <CreateMode
                    component={selectedComponent}
                    onSave={async (component) => {
                        await saveComponent(component);
                        finishCreating();
                    }}
                    onCancel={() => {
                        // 생성 취소 시 컴포넌트 삭제
                        deleteComponent(selectedComponent.id);
                        finishCreating();
                        selectComponent(null);
                    }}
                />
            </div>
        );
    }

    // 인라인 편집 모드 (View + Edit 통합)
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10">
            <InlineEditMode
                component={selectedComponent}
                onSave={async (component) => {
                    await saveComponent(component);
                }}
                onDelete={async () => {
                    await deleteComponent(selectedComponent.id);
                    selectComponent(null);
                }}
            />
        </div>
    );
}
