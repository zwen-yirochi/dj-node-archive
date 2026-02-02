'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import { cn } from '@/lib/utils';

interface ViewSectionProps {
    isDraggingOver?: boolean;
}

export default function ViewSection({ isDraggingOver = false }: ViewSectionProps) {
    const viewItems = useEditorStore((state) => state.viewItems);
    const components = useEditorStore((state) => state.components);
    const toggleViewItemVisibility = useEditorStore((state) => state.toggleViewItemVisibility);

    // Droppable zone for adding components to View
    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    // useMemo로 정렬 및 카운트 계산
    const sortedViewItems = useMemo(
        () => [...viewItems].sort((a, b) => a.order - b.order),
        [viewItems]
    );

    const visibleCount = useMemo(
        () => viewItems.filter((item) => item.isVisible).length,
        [viewItems]
    );

    const showDropIndicator = isDraggingOver || isOver;

    return (
        <SectionItem
            section="view"
            title="View"
            icon={<Eye className="h-3.5 w-3.5" />}
            count={visibleCount}
        >
            <div
                ref={setNodeRef}
                className={cn(
                    'min-h-[60px] rounded-lg transition-colors',
                    showDropIndicator && 'ring-dashed bg-white/5 ring-1 ring-white/20'
                )}
            >
                <SortableContext
                    items={sortedViewItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-0.5 py-1">
                        {sortedViewItems.map((viewItem) => {
                            const component = components.find((c) => c.id === viewItem.componentId);
                            if (!component) return null;

                            return (
                                <TreeItem
                                    key={viewItem.id}
                                    component={component}
                                    isInViewSection
                                    viewItemId={viewItem.id}
                                    isVisible={viewItem.isVisible}
                                    onToggleVisibility={() => toggleViewItemVisibility(viewItem.id)}
                                />
                            );
                        })}

                        {sortedViewItems.length === 0 && (
                            <p
                                className={cn(
                                    'px-3 py-2 text-center text-xs text-white/40',
                                    showDropIndicator && 'text-white/60'
                                )}
                            >
                                {showDropIndicator
                                    ? '여기에 드롭하여 추가'
                                    : '컴포넌트를 드래그하여 추가'}
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </SectionItem>
    );
}
