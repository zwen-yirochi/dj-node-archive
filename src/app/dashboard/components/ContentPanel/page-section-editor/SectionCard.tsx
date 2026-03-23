import { memo } from 'react';

import type { ContentEntry, Section } from '@/types/domain';

import { SectionEntryList } from './SectionEntryList';
import { SectionHeader } from './SectionHeader';
import { SortableSectionWrapper } from './SortableSectionWrapper';

interface Props {
    section: Section;
    entries: ContentEntry[];
    onUpdateField: (field: Partial<Pick<Section, 'title' | 'viewType' | 'isVisible'>>) => void;
    onDelete: () => void;
    onRemoveEntry: (entryId: string) => void;
    addableEntries?: ContentEntry[];
    onAddEntry?: (entryId: string) => void;
}

export const SectionCard = memo(function SectionCard({
    section,
    entries,
    onUpdateField,
    onDelete,
    onRemoveEntry,
    addableEntries,
    onAddEntry,
}: Props) {
    return (
        <SortableSectionWrapper
            section={section}
            className="mb-3 rounded-xl border border-dashboard-border bg-dashboard-bg-card"
        >
            {(dragHandleProps) => (
                <>
                    <SectionHeader
                        title={section.title}
                        viewType={section.viewType}
                        isVisible={section.isVisible}
                        dragHandleProps={dragHandleProps}
                        onTitleChange={(title) => onUpdateField({ title })}
                        onViewTypeChange={(viewType) => onUpdateField({ viewType })}
                        onToggleVisibility={() => onUpdateField({ isVisible: !section.isVisible })}
                        onDelete={onDelete}
                    />
                    <div className="pb-2 pl-8 pr-2">
                        <SectionEntryList
                            sectionId={section.id}
                            viewType={section.viewType}
                            entries={entries}
                            onRemoveEntry={onRemoveEntry}
                            addableEntries={addableEntries}
                            onAddEntry={onAddEntry}
                        />
                    </div>
                </>
            )}
        </SortableSectionWrapper>
    );
});
