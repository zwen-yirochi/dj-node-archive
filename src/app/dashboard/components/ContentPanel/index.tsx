'use client';

import { useComponentStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { useMemo } from 'react';
import BioDesignPanel from './BioDesignPanel';
import EditMode from './EditMode';
import EmptyState from './EmptyState';
import PageListView from './PageListView';
import ViewMode from './ViewMode';

export default function ContentPanel() {
    // UI Store
    const selectedComponentId = useUIStore((state) => state.selectedComponentId);
    const editMode = useUIStore((state) => state.editMode);
    const activePanel = useUIStore((state) => state.activePanel);
    const setEditMode = useUIStore((state) => state.setEditMode);
    const selectComponent = useUIStore((state) => state.selectComponent);

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

    // 편집 모드
    if (editMode === 'edit') {
        return (
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <EditMode
                    component={selectedComponent}
                    onSave={async (component) => {
                        await saveComponent(component);
                        setEditMode('view');
                    }}
                    onCancel={() => setEditMode('view')}
                    onDelete={async () => {
                        await deleteComponent(selectedComponent.id);
                        selectComponent(null);
                    }}
                />
            </div>
        );
    }

    // 뷰 모드
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10">
            <ViewMode
                component={selectedComponent}
                onEdit={() => setEditMode('edit')}
                onDelete={async () => {
                    await deleteComponent(selectedComponent.id);
                    selectComponent(null);
                }}
            />
        </div>
    );
}
