'use client';

import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileText } from 'lucide-react';
import { useMemo } from 'react';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';

interface ViewSectionProps {
    isDraggingOver?: boolean;
    onDeleteComponent?: (id: string) => void;
}

export default function ViewSection({ isDraggingOver = false }: ViewSectionProps) {
    const viewItems = useEditorStore((state) => state.viewItems);
    const components = useEditorStore((state) => state.components);
    const toggleViewItemVisibility = useEditorStore((state) => state.toggleViewItemVisibility);
    const removeFromView = useEditorStore((state) => state.removeFromView);

    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    const sortedViewItems = useMemo(
        () => [...viewItems].sort((a, b) => a.order - b.order),
        [viewItems]
    );

    const visibleCount = useMemo(
        () => viewItems.filter((item) => item.isVisible).length,
        [viewItems]
    );

    const showDropIndicator = isDraggingOver || isOver;

    const handleDeleteFromView = (viewItemId: string) => {
        removeFromView(viewItemId);
    };

    return (
        <SectionItem
            section="view"
            title="Page"
            icon={<FileText className="h-4 w-4" />}
            count={visibleCount}
        >
            <div
                ref={setNodeRef}
                className={cn(
                    'min-h-[32px] rounded-md transition-colors',
                    showDropIndicator && 'ring-dashed bg-neutral-200 ring-1 ring-neutral-400'
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
                                    'px-3 py-2 text-center text-xs text-neutral-400',
                                    showDropIndicator && 'text-neutral-600'
                                )}
                            >
                                {showDropIndicator ? '여기에 드롭하여 추가' : '드래그하여 추가'}
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </SectionItem>
    );
}
