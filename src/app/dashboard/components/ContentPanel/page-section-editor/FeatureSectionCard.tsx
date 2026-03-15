import { useDroppable } from '@dnd-kit/core';
import { memo } from 'react';

import { GripVertical, Sparkles, Trash2 } from 'lucide-react';

import type { ContentEntry, Section } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';

import { SortableSectionWrapper } from './SortableSectionWrapper';

interface Props {
    section: Section;
    entries: ContentEntry[];
    onDelete: () => void;
    onRemoveEntry: (entryId: string) => void;
}

export const FeatureSectionCard = memo(function FeatureSectionCard({
    section,
    entries,
    onDelete,
}: Props) {
    const featured = entries[0];

    return (
        <SortableSectionWrapper
            section={section}
            className="mb-3 rounded-xl border border-dashboard-border bg-dashboard-bg-card"
        >
            {(dragHandleProps) => (
                <>
                    {/* Header — drag handle + entry title + feature label + delete */}
                    <div className="flex items-center gap-2 px-2 py-2">
                        <button
                            {...dragHandleProps}
                            className="cursor-grab text-dashboard-text-placeholder"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        {featured ? (
                            <span className="flex-1 truncate text-sm font-medium text-dashboard-text">
                                {featured.title || 'Untitled'}
                            </span>
                        ) : (
                            <span className="flex-1 text-sm text-dashboard-text-placeholder">
                                No entry
                            </span>
                        )}
                        <div className="flex items-center gap-1 rounded-md border border-dashboard-border px-2 py-1 text-dashboard-text-placeholder">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-[10px]">Feature</span>
                        </div>
                        <button
                            onClick={onDelete}
                            className="text-dashboard-text-placeholder hover:text-red-400"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="pb-2 pl-8 pr-2">
                        {featured ? (
                            <FeatureEntryDetail entry={featured} />
                        ) : (
                            <FeatureDropTarget sectionId={section.id} />
                        )}
                    </div>
                </>
            )}
        </SortableSectionWrapper>
    );
});

// ─── Feature entry detail ──────────────────────────────────────

function FeatureEntryDetail({ entry }: { entry: ContentEntry }) {
    const config = ENTRY_TYPE_CONFIG[entry.type];
    const imageUrl = entry.type !== 'custom' ? entry.imageUrls[0] : undefined;
    const date =
        entry.type === 'event' ? formatDateCompact(entry.date) : formatDateCompact(entry.createdAt);

    return (
        <div className="flex gap-3 px-1 py-1">
            {/* Thumbnail */}
            {imageUrl && (
                <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded border border-dashboard-border">
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <TypeBadge type={config.badgeType} size="sm" />
                    <span className="text-[10px] text-dashboard-text-placeholder">{date}</span>
                </div>
                {entry.type === 'event' && entry.venue?.name && (
                    <p className="truncate text-xs text-dashboard-text-muted">
                        @ {entry.venue.name}
                    </p>
                )}
                {entry.type === 'mixset' && entry.durationMinutes && (
                    <p className="text-xs text-dashboard-text-muted">{entry.durationMinutes}min</p>
                )}
            </div>
        </div>
    );
}

// ─── Empty drop target ─────────────────────────────────────────

function FeatureDropTarget({ sectionId }: { sectionId: string }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable:${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex items-center justify-center rounded-lg border border-dashed py-6 transition-colors ${
                isOver ? 'border-blue-400 bg-blue-400/5' : 'border-dashboard-border'
            }`}
        >
            <p className="text-xs text-dashboard-text-placeholder">
                Drag an entry here to feature it
            </p>
        </div>
    );
}
