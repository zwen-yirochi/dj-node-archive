'use client';

import { cn } from '@/lib/utils';
import { useContentEntryStore } from '@/stores/contentEntryStore';
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
    // Content Entry Store - is_visible 기반으로 직접 필터링
    const entries = useContentEntryStore((state) => state.entries);
    const toggleVisibility = useContentEntryStore((state) => state.toggleVisibility);
    const removeFromDisplay = useContentEntryStore((state) => state.removeFromDisplay);

    const { setNodeRef, isOver } = useDroppable({
        id: 'view-drop-zone',
    });

    // displayOrder가 숫자인 엔트리만 displayOrder 순으로 정렬 (Page에 표시된 엔트리)
    // null과 undefined 모두 제외
    const displayedEntries = useMemo(
        () =>
            entries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!),
        [entries]
    );

    const showDropIndicator = isDraggingOver || isOver;

    const handleRemoveFromView = (entryId: string) => {
        removeFromDisplay(entryId);
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
                    items={displayedEntries.map((entry) => `view-${entry.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="relative py-0.5">
                        {/* Tree Line - 세로선 */}
                        {displayedEntries.length > 0 && (
                            <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                        )}
                        {displayedEntries.map((entry) => (
                            <TreeItem
                                key={`view-${entry.id}`}
                                entry={entry}
                                isInViewSection
                                isVisible={entry.isVisible}
                                onToggleVisibility={() => toggleVisibility(entry.id)}
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
                                {showDropIndicator ? '여기에 드롭하여 추가' : '드래그하여 추가'}
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
