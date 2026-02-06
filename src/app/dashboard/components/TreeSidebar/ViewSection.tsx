'use client';

import { cn } from '@/lib/utils';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import TreeItem from './TreeItem';

interface ViewSectionProps {
    isDraggingOver?: boolean;
    isCollapsed?: boolean;
    onDeleteEntry?: (id: string) => void;
}

export default function ViewSection({
    isDraggingOver = false,
    isCollapsed = false,
}: ViewSectionProps) {
    // Display Entry Store
    const displayEntries = useDisplayEntryStore((state) => state.displayEntries);
    const toggleVisibility = useDisplayEntryStore((state) => state.toggleVisibility);
    const removeFromView = useDisplayEntryStore((state) => state.removeFromDisplay);

    // Content Entry Store
    const entries = useContentEntryStore((state) => state.entries);

    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    const sortedDisplayEntries = useMemo(
        () => [...displayEntries].sort((a, b) => a.order - b.order),
        [displayEntries]
    );

    const showDropIndicator = isDraggingOver || isOver;

    const handleDeleteFromView = (displayEntryId: string) => {
        removeFromView(displayEntryId);
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
                    items={sortedDisplayEntries.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="relative py-0.5">
                        {/* Tree Line - 세로선 */}
                        {sortedDisplayEntries.length > 0 && (
                            <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                        )}
                        {sortedDisplayEntries.map((displayEntry) => {
                            const entry = entries.find((e) => e.id === displayEntry.entryId);
                            if (!entry) return null;

                            return (
                                <TreeItem
                                    key={displayEntry.id}
                                    entry={entry}
                                    isInViewSection
                                    displayEntryId={displayEntry.id}
                                    isVisible={displayEntry.isVisible}
                                    onToggleVisibility={() => toggleVisibility(displayEntry.id)}
                                    onDelete={() => handleDeleteFromView(displayEntry.id)}
                                />
                            );
                        })}

                        {sortedDisplayEntries.length === 0 && (
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
