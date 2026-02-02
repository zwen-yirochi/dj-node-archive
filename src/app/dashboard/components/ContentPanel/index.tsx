'use client';

import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/types';
import { useMemo } from 'react';
import EditMode from './EditMode';
import EmptyState from './EmptyState';
import PageListView from './PageListView';
import ViewMode from './ViewMode';

interface ContentPanelProps {
    onSave: (component: ComponentData) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function ContentPanel({ onSave, onDelete }: ContentPanelProps) {
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const components = useEditorStore((state) => state.components);
    const editMode = useEditorStore((state) => state.editMode);
    const activePanel = useEditorStore((state) => state.activePanel);
    const setEditMode = useEditorStore((state) => state.setEditMode);
    const selectComponent = useEditorStore((state) => state.selectComponent);

    // useMemo로 선택된 컴포넌트 찾기
    const selectedComponent = useMemo(() => {
        if (!selectedComponentId) return null;
        return components.find((c) => c.id === selectedComponentId) ?? null;
    }, [selectedComponentId, components]);

    // Page 패널 모드
    if (activePanel === 'page') {
        return (
            <div className="h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <PageListView />
            </div>
        );
    }

    // 선택된 컴포넌트가 없으면 EmptyState
    if (!selectedComponent) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-white/10">
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
                        await onSave(component);
                        setEditMode('view');
                    }}
                    onCancel={() => setEditMode('view')}
                    onDelete={async () => {
                        await onDelete(selectedComponent.id);
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
                    await onDelete(selectedComponent.id);
                    selectComponent(null);
                }}
            />
        </div>
    );
}
