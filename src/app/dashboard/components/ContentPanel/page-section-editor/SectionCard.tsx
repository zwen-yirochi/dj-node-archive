import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { ContentEntry, Section, ViewType } from '@/types/domain';

import { SectionEntryList } from './SectionEntryList';
import { SectionHeader } from './SectionHeader';

interface Props {
    section: Section;
    entries: ContentEntry[];
    onUpdateField: (field: Partial<Pick<Section, 'title' | 'viewType'>>) => void;
    onDelete: () => void;
    onRemoveEntry: (entryId: string) => void;
}

export function SectionCard({ section, entries, onUpdateField, onDelete, onRemoveEntry }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        data: { type: 'section', section },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
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
                    entries={entries}
                    onRemoveEntry={onRemoveEntry}
                />
            </div>
        </div>
    );
}
