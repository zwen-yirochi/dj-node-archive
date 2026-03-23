import { useDroppable } from '@dnd-kit/core';
import {
    horizontalListSortingStrategy,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { ContentEntry, ViewType } from '@/types/domain';
import { cn } from '@/lib/utils';

import { SectionEntryItem } from './SectionEntryItem';

interface Props {
    sectionId: string;
    viewType: ViewType;
    entries: ContentEntry[];
    onRemoveEntry: (entryId: string) => void;
}

export function SectionEntryList({ sectionId, viewType, entries, onRemoveEntry }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable:${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    const sortableIds = entries.map((e) => `${sectionId}:${e.id}`);

    const layoutClass = getLayoutClass(viewType);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-h-[40px] rounded-md border border-dashed transition-colors',
                isOver ? 'drop-zone-active' : 'border-transparent'
            )}
        >
            <SortableContext
                items={sortableIds}
                strategy={
                    viewType === 'carousel'
                        ? horizontalListSortingStrategy
                        : verticalListSortingStrategy
                }
            >
                {entries.length === 0 ? (
                    <EmptyState viewType={viewType} />
                ) : (
                    <div className={layoutClass}>
                        {entries.map((entry) => (
                            <SectionEntryItem
                                key={entry.id}
                                entry={entry}
                                sectionId={sectionId}
                                variant={viewType === 'carousel' ? 'card' : 'list'}
                                onRemove={() => onRemoveEntry(entry.id)}
                            />
                        ))}
                    </div>
                )}
            </SortableContext>
        </div>
    );
}

function getLayoutClass(viewType: ViewType): string {
    switch (viewType) {
        case 'carousel':
            return 'flex gap-2 overflow-x-auto scrollbar-hide pb-1';
        case 'feature':
        case 'list':
        default:
            return 'space-y-0';
    }
}

function EmptyState({ viewType }: { viewType: ViewType }) {
    const hints: Record<string, string> = {
        carousel: 'Horizontal scrollable cards',
        list: 'Vertical list',
        feature: 'Highlight first entry',
    };

    return (
        <p className="py-3 text-center text-xs text-dashboard-text-placeholder">
            Drag entries here · {hints[viewType]}
        </p>
    );
}
