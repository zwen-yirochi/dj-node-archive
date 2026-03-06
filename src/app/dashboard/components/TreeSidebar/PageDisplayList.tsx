'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';

import TreeItem from './TreeItem';

interface PageDisplayListProps {
    entries: ContentEntry[];
    isDragging?: boolean;
    isCollapsed?: boolean;
}

const MAX_VISIBLE = 5;

export default function PageDisplayList({
    entries,
    isDragging = false,
    isCollapsed = false,
}: PageDisplayListProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    const showDropIndicator = isOver;

    // Show even when collapsed if dragging over
    const shouldShow = !isCollapsed || showDropIndicator || isDragging;

    const visibleEntries = entries.slice(0, MAX_VISIBLE);
    const hiddenCount = entries.length - visibleEntries.length;

    return (
        <div
            ref={setNodeRef}
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: shouldShow ? '1fr' : '0fr' }}
        >
            <div className="overflow-hidden">
                <div
                    className={cn(
                        'rounded-md transition-all duration-200',
                        isDragging || showDropIndicator ? 'min-h-[48px] py-1' : 'min-h-[32px]',
                        isDragging &&
                            !showDropIndicator &&
                            'border border-dashed border-dashboard-border-hover bg-dashboard-bg-hover/50',
                        showDropIndicator &&
                            'border border-dashed border-dashboard-text-muted bg-dashboard-bg-active'
                    )}
                >
                    <SortableContext
                        items={entries.map((entry) => `view-${entry.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="relative py-0.5">
                            {/* Tree Line - vertical line */}
                            {entries.length > 0 && (
                                <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                            )}
                            {visibleEntries.map((entry) => (
                                <TreeItem key={`view-${entry.id}`} entry={entry} isInPageDisplay />
                            ))}

                            {hiddenCount > 0 && (
                                <p className="py-1 pl-7 text-xs text-dashboard-text-placeholder">
                                    +{hiddenCount} more
                                </p>
                            )}

                            <div
                                className={cn(
                                    'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                                    entries.length === 0 || isDragging
                                        ? 'grid-rows-[1fr] opacity-100'
                                        : 'grid-rows-[0fr] opacity-0'
                                )}
                            >
                                <div className="overflow-hidden">
                                    <p
                                        className={cn(
                                            'px-3 py-2 text-center text-xs',
                                            showDropIndicator
                                                ? 'font-medium text-dashboard-text-secondary'
                                                : isDragging
                                                  ? 'text-dashboard-text-muted'
                                                  : 'text-dashboard-text-placeholder'
                                        )}
                                    >
                                        {showDropIndicator
                                            ? 'Drop to add to Page'
                                            : isDragging
                                              ? 'Drop here to add to Page'
                                              : 'Drag to add'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SortableContext>
                </div>
            </div>
        </div>
    );
}
