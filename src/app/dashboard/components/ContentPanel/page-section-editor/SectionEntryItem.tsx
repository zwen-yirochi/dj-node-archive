import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GripVertical, X } from 'lucide-react';

import type { ContentEntry } from '@/types/domain';
import { sortableAnimateLayoutChanges } from '@/lib/dnd/animate';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';

import { selectSetView, useDashboardStore } from '../../../stores/dashboardStore';

interface Props {
    entry: ContentEntry;
    sectionId: string;
    variant?: 'list' | 'card';
    onRemove: () => void;
}

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'custom') return undefined;
    return entry.imageUrls[0];
}

export function SectionEntryItem({ entry, sectionId, variant = 'list', onRemove }: Props) {
    const setView = useDashboardStore(selectSetView);

    const handleClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on a button (drag handle, remove)
        if ((e.target as HTMLElement).closest('button')) return;
        setView({ kind: 'detail', entryId: entry.id }, { fromPageList: true });
    };
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${sectionId}:${entry.id}`,
        data: { type: 'section-entry', entry, sectionId },
        animateLayoutChanges: sortableAnimateLayoutChanges,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    if (variant === 'card') {
        const imageUrl = getImageUrl(entry);
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={handleClick}
                className={cn(
                    'group/card relative w-28 flex-shrink-0 cursor-pointer rounded-md border border-dashboard-border bg-dashboard-bg-muted',
                    isDragging && 'drag-source-ghost'
                )}
            >
                {/* Drag handle overlay */}
                <button
                    {...attributes}
                    {...listeners}
                    className="drag-handle-hover absolute left-0.5 top-0.5 z-10 rounded bg-dashboard-bg-card/80 p-0.5"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                {/* Remove button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute right-0.5 top-0.5 z-10 rounded bg-dashboard-bg-card/80 p-0.5 text-dashboard-text-placeholder opacity-0 hover:text-red-400 group-hover/card:opacity-100"
                >
                    <X className="h-3 w-3" />
                </button>
                {/* Image */}
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-md bg-dashboard-bg-hover">
                    {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <TypeBadge type={config.badgeType} size="sm" />
                        </div>
                    )}
                </div>
                {/* Badge + Title */}
                <div className="flex items-center gap-1.5 px-1.5 py-1">
                    <TypeBadge type={config.badgeType} size="sm" />
                    <span className="flex-1 truncate text-xs text-dashboard-text">
                        {entry.title || 'Untitled'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleClick}
            className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-dashboard-border hover:bg-dashboard-bg-hover/50',
                isDragging && 'drag-source-ghost'
            )}
        >
            <button {...attributes} {...listeners} className="drag-handle">
                <GripVertical className="h-4 w-4" />
            </button>
            <TypeBadge type={config.badgeType} size="sm" />
            <span className="flex-1 truncate text-sm text-dashboard-text">
                {entry.title || 'Untitled'}
            </span>
            <button
                onClick={onRemove}
                className="invisible text-dashboard-text-placeholder hover:text-red-400 group-hover:visible"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
