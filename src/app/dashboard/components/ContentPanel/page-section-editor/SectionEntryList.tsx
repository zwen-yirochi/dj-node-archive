import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { ContentEntry } from '@/types/domain';

import { SectionEntryItem } from './SectionEntryItem';

interface Props {
    sectionId: string;
    entries: ContentEntry[];
    onRemoveEntry: (entryId: string) => void;
}

export function SectionEntryList({ sectionId, entries, onRemoveEntry }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable:${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    const sortableIds = entries.map((e) => `${sectionId}:${e.id}`);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[40px] rounded-md border border-dashed transition-colors ${
                isOver ? 'border-blue-400 bg-blue-400/5' : 'border-transparent'
            }`}
        >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {entries.length === 0 ? (
                    <p className="py-3 text-center text-xs text-dashboard-text-placeholder">
                        엔트리를 드래그해서 추가하세요
                    </p>
                ) : (
                    entries.map((entry) => (
                        <SectionEntryItem
                            key={entry.id}
                            entry={entry}
                            sectionId={sectionId}
                            onRemove={() => onRemoveEntry(entry.id)}
                        />
                    ))
                )}
            </SortableContext>
        </div>
    );
}
