'use client';

import {
    defaultAnimateLayoutChanges,
    useSortable,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import { GripVertical, MoreHorizontal } from 'lucide-react';

import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types';
import { formatDateCompact } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { resolveMenuItems, TREE_PAGE_DISPLAY_MENU } from '@/app/dashboard/config/ui/menu';
import { TypeBadge } from '@/components/dna';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryMutations } from '../../../hooks';
import { useConfirmAction } from '../../../hooks/use-confirm-action';
import { selectSetView, useDashboardStore } from '../../../stores/dashboardStore';
import { ConfirmDialog } from '../../ui/ConfirmDialog';

// ============================================
// DetailText
// ============================================

function DetailText({ entry }: { entry: ContentEntry }) {
    const parts: string[] = [];

    switch (entry.type) {
        case 'event': {
            const e = entry as EventEntry;
            parts.push(formatDateCompact(e.date));
            if (e.venue?.name) parts.push(`@ ${e.venue.name}`);
            if (e.lineup?.length > 0) parts.push(e.lineup.map((a) => a.name).join(', '));
            break;
        }
        case 'mixset': {
            const m = entry as MixsetEntry;
            if (m.url) {
                try {
                    parts.push(new URL(m.url).hostname);
                } catch {
                    /* skip */
                }
            }
            if (m.durationMinutes) parts.push(`${m.durationMinutes}min`);
            if (m.tracklist?.length > 0) parts.push(`${m.tracklist.length} tracks`);
            break;
        }
        case 'link': {
            const l = entry as LinkEntry;
            try {
                parts.push(new URL(l.url).hostname);
            } catch {
                /* skip */
            }
            break;
        }
    }

    if (parts.length === 0) parts.push(formatDateCompact(entry.createdAt));

    return <>{parts.join(' · ')}</>;
}

// ============================================
// SortableItem
// ============================================

interface SortableItemProps {
    entry: ContentEntry;
}

function SortableItem({ entry }: SortableItemProps) {
    const setView = useDashboardStore(selectSetView);
    const confirmAction = useConfirmAction();
    const { remove, removeFromDisplay, toggleVisibility } = useEntryMutations();

    const animateLayoutChanges: AnimateLayoutChanges = (args) => {
        if (args.wasDragging) return false;
        if (args.isSorting) return true;
        return defaultAnimateLayoutChanges(args);
    };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: entry.id,
        animateLayoutChanges,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];
    const imageUrl = 'imageUrls' in entry ? entry.imageUrls?.[0] : undefined;

    const handleClick = () => {
        setView({ kind: 'detail', entryId: entry.id }, { fromPageList: true });
    };

    // Config-driven menu + confirm strategy (same pattern as TreeItem)
    const handlers = confirmAction.wrapHandlers(
        TREE_PAGE_DISPLAY_MENU,
        {
            edit: handleClick,
            delete: () => {
                const cv = useDashboardStore.getState().contentView;
                if (cv.kind === 'detail' && cv.entryId === entry.id) {
                    setView({ kind: 'page' });
                }
                remove.mutate(entry.id);
            },
            'remove-from-page': () => removeFromDisplay.mutate(entry.id),
            'toggle-visibility': () => toggleVisibility.mutate(entry.id),
        },
        entry as unknown as Record<string, unknown>
    );
    const menuItems = resolveMenuItems(TREE_PAGE_DISPLAY_MENU, handlers, {
        isVisible: entry.isVisible ?? true,
    });

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    'group flex items-center gap-3 rounded-lg border p-3 transition-all',
                    isDragging
                        ? 'shadow-panel-hover border-dashboard-border-hover'
                        : 'hover:shadow-panel border-dashboard-border/60 hover:border-dashboard-border-hover',
                    entry.isVisible === false && 'opacity-60'
                )}
            >
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none self-center text-dashboard-text-placeholder hover:text-dashboard-text-secondary active:cursor-grabbing"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Thumbnail */}
                {imageUrl ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <div className="flex-shrink-0" />
                )}

                {/* Content */}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={handleClick}>
                    <div className="flex items-center gap-2">
                        <TypeBadge type={config.badgeType} size="sm" />
                        <p className="truncate text-sm font-medium text-dashboard-text">
                            {entry.title || 'Untitled'}
                        </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-dashboard-text-muted">
                        <DetailText entry={entry} />
                    </p>
                </div>

                {/* More menu */}
                <SimpleDropdown
                    trigger={
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-md opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-4 w-4 text-dashboard-text-muted" />
                        </button>
                    }
                    items={menuItems}
                    contentClassName="w-44"
                />
            </div>

            <ConfirmDialog
                pending={confirmAction.pending}
                matchValue={confirmAction.matchValue}
                onConfirm={confirmAction.confirm}
                onClose={confirmAction.close}
            />
        </>
    );
}

export default memo(SortableItem);
