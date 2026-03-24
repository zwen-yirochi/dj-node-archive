import { useDroppable } from '@dnd-kit/core';
import {
    horizontalListSortingStrategy,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';

import { Plus } from 'lucide-react';

import type { ContentEntry, ViewType } from '@/types/domain';
import { cn } from '@/lib/utils';

import { AddEntryModal } from './AddEntryModal';
import { SectionEntryItem } from './SectionEntryItem';

interface Props {
    sectionId: string;
    viewType: ViewType;
    entries: ContentEntry[];
    onRemoveEntry: (entryId: string) => void;
    addableEntries?: ContentEntry[];
    onAddEntry?: (entryId: string) => void;
}

export function SectionEntryList({
    sectionId,
    viewType,
    entries,
    onRemoveEntry,
    addableEntries,
    onAddEntry,
}: Props) {
    const [addModalOpen, setAddModalOpen] = useState(false);
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
                    <EmptyState
                        viewType={viewType}
                        showAdd={!!onAddEntry && !!addableEntries?.length}
                        onClickAdd={() => setAddModalOpen(true)}
                    />
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

            {onAddEntry && addableEntries && addableEntries.length > 0 && (
                <>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-dashboard-text-placeholder hover:bg-dashboard-bg-hover hover:text-dashboard-text-secondary"
                    >
                        <Plus className="h-3 w-3" />
                        Add entry
                    </button>
                    <AddEntryModal
                        open={addModalOpen}
                        onOpenChange={setAddModalOpen}
                        entries={addableEntries}
                        onSelect={(entryIds: string[]) => {
                            for (const id of entryIds) {
                                onAddEntry(id);
                            }
                        }}
                    />
                </>
            )}
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

function EmptyState({
    viewType,
    showAdd,
    onClickAdd,
}: {
    viewType: ViewType;
    showAdd?: boolean;
    onClickAdd?: () => void;
}) {
    const hints: Record<string, string> = {
        carousel: 'Horizontal scrollable cards',
        list: 'Vertical list',
        feature: 'Highlight first entry',
    };

    return (
        <div className="py-3 text-center text-xs text-dashboard-text-placeholder">
            <p>Drag entries here · {hints[viewType]}</p>
            {showAdd && (
                <button
                    onClick={onClickAdd}
                    className="mt-1 inline-flex items-center gap-1 text-dashboard-text-placeholder hover:text-dashboard-text-secondary"
                >
                    <Plus className="h-3 w-3" />
                    or click to add
                </button>
            )}
        </div>
    );
}
