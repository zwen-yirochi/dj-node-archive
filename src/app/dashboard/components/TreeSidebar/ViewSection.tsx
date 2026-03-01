'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';

import TreeItem from './TreeItem';

interface ViewSectionProps {
    entries: ContentEntry[];
    isDraggingOver?: boolean;
    isCollapsed?: boolean;
    onDeleteEntry?: (id: string) => void;
    removeFromDisplay?: (id: string) => void;
}

export default function ViewSection({
    entries,
    isDraggingOver = false,
    isCollapsed = false,
    onDeleteEntry,
    removeFromDisplay,
}: ViewSectionProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    const displayedEntries = entries
        .filter((e) => typeof e.displayOrder === 'number')
        .sort((a, b) => a.displayOrder! - b.displayOrder!);

    const showDropIndicator = isDraggingOver || isOver;

    const handleRemoveFromView = (entryId: string) => {
        if (removeFromDisplay) removeFromDisplay(entryId);
    };

    // Show even when collapsed if dragging over
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
                    items={displayedEntries.map((entry) => `view-${entry.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="relative py-0.5">
                        {/* Tree Line - vertical line */}
                        {displayedEntries.length > 0 && (
                            <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                        )}
                        {displayedEntries.map((entry) => (
                            <TreeItem
                                key={`view-${entry.id}`}
                                entry={entry}
                                isInViewSection
                                isVisible={entry.isVisible}
                                onDelete={() => handleRemoveFromView(entry.id)}
                            />
                        ))}

                        {displayedEntries.length === 0 && (
                            <p
                                className={cn(
                                    'px-3 py-2 text-center text-xs text-dashboard-text-placeholder',
                                    showDropIndicator && 'text-dashboard-text-secondary'
                                )}
                            >
                                {showDropIndicator ? 'Drop here to add' : 'Drag to add'}
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
