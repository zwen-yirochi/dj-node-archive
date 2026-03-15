import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GripVertical, X } from 'lucide-react';

import type { ContentEntry } from '@/types/domain';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';

interface Props {
    entry: ContentEntry;
    sectionId: string;
    onRemove: () => void;
}

export function SectionEntryItem({ entry, sectionId, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${sectionId}:${entry.id}`,
        data: { type: 'section-entry', entry, sectionId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-dashboard-border hover:bg-dashboard-bg-hover/50"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-dashboard-text-placeholder"
            >
                <GripVertical className="h-3.5 w-3.5" />
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
