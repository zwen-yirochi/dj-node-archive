'use client';

import { cn } from '@/lib/utils';
import { useComponentStore } from '@/stores/editorStore';
import { useViewStore } from '@/stores/viewStore';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import TreeItem from './TreeItem';

interface ViewSectionProps {
    isDraggingOver?: boolean;
    isCollapsed?: boolean;
    onDeleteComponent?: (id: string) => void;
}

export default function ViewSection({
    isDraggingOver = false,
    isCollapsed = false,
}: ViewSectionProps) {
    // View Store
    const viewItems = useViewStore((state) => state.viewItems);
    const toggleViewItemVisibility = useViewStore((state) => state.toggleViewItemVisibility);
    const removeFromView = useViewStore((state) => state.removeFromView);

    // Component Store
    const components = useComponentStore((state) => state.components);

    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    const sortedViewItems = useMemo(
        () => [...viewItems].sort((a, b) => a.order - b.order),
        [viewItems]
    );

    const showDropIndicator = isDraggingOver || isOver;

    const handleDeleteFromView = (viewItemId: string) => {
        removeFromView(viewItemId);
    };

    // 드래그 중이면 접힌 상태라도 표시
    const shouldShow = !isCollapsed || showDropIndicator;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'overflow-hidden transition-all duration-200',
                shouldShow ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            )}
        >
            <div
                className={cn(
                    'min-h-[32px] rounded-md transition-colors',
                    showDropIndicator &&
                        'ring-dashed bg-dashboard-bg-active ring-1 ring-dashboard-border-hover'
                )}
            >
                <SortableContext
                    items={sortedViewItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="py-0.5">
                        {sortedViewItems.map((viewItem, index) => {
                            const component = components.find((c) => c.id === viewItem.componentId);
                            if (!component) return null;

                            return (
                                <TreeItem
                                    key={viewItem.id}
                                    component={component}
                                    isInViewSection
                                    viewItemId={viewItem.id}
                                    isVisible={viewItem.isVisible}
                                    isLast={index === sortedViewItems.length - 1}
                                    onToggleVisibility={() => toggleViewItemVisibility(viewItem.id)}
                                    onDelete={() => handleDeleteFromView(viewItem.id)}
                                />
                            );
                        })}

                        {sortedViewItems.length === 0 && (
                            <p
                                className={cn(
                                    'px-3 py-2 text-center text-xs text-dashboard-text-placeholder',
                                    showDropIndicator && 'text-dashboard-text-secondary'
                                )}
                            >
                                {showDropIndicator ? '여기에 드롭하여 추가' : '드래그하여 추가'}
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
