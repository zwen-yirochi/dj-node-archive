import {
    defaultAnimateLayoutChanges,
    useSortable,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import type { ContentEntry, Section } from '@/types/domain';

import { SectionEntryList } from './SectionEntryList';
import { SectionHeader } from './SectionHeader';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    const { isSorting, wasDragging } = args;
    if (wasDragging) return false;
    if (isSorting) return true;
    return defaultAnimateLayoutChanges(args);
};

interface Props {
    section: Section;
    entries: ContentEntry[];
    onUpdateField: (field: Partial<Pick<Section, 'title' | 'viewType'>>) => void;
    onDelete: () => void;
    onRemoveEntry: (entryId: string) => void;
}

export const SectionCard = memo(function SectionCard({
    section,
    entries,
    onUpdateField,
    onDelete,
    onRemoveEntry,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } =
        useSortable({
            id: section.id,
            animateLayoutChanges,
            data: { type: 'section', section },
        });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition: isSorting
            ? 'transform 100ms ease'
            : (transition ?? 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)'),
        ...(isDragging && { opacity: 0, pointerEvents: 'none' }),
    };

    return (
        <div
            id={`section-${section.id}`}
            ref={setNodeRef}
            style={style}
            className="mb-3 rounded-xl border border-dashboard-border bg-dashboard-bg-card"
        >
            <SectionHeader
                title={section.title}
                viewType={section.viewType}
                dragHandleProps={{ ...attributes, ...listeners }}
                onTitleChange={(title) => onUpdateField({ title })}
                onViewTypeChange={(viewType) => onUpdateField({ viewType })}
                onDelete={onDelete}
            />
            <div className="px-2 pb-2">
                <SectionEntryList
                    sectionId={section.id}
                    viewType={section.viewType}
                    entries={entries}
                    onRemoveEntry={onRemoveEntry}
                />
            </div>
        </div>
    );
});
