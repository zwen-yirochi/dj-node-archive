'use client';

import {
    defaultAnimateLayoutChanges,
    useSortable,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import { MoreHorizontal } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { resolveMenuItems, TREE_ENTRY_MENU } from '@/app/dashboard/config/ui/menu';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryMutations } from '../../hooks';
import { useConfirmAction } from '../../hooks/use-confirm-action';
import { usePageMeta } from '../../hooks/use-editor-data';
import { useSectionMutations } from '../../hooks/use-section-mutations';
import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TreeItemProps {
    entry: ContentEntry;
}

function TreeItem({ entry }: TreeItemProps) {
    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // Confirm action (config-driven)
    const confirmAction = useConfirmAction();

    // Mutations
    const { remove } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    // Section data
    const { data: pageMeta } = usePageMeta();
    const sections = pageMeta?.sections ?? [];
    const isInSection = sections.some((s) => s.entryIds.includes(entry.id));

    const isSelected = contentView.kind === 'detail' && contentView.entryId === entry.id;
    const config = ENTRY_TYPE_CONFIG[entry.type];

    const sortableId = entry.id;

    const animateLayoutChanges: AnimateLayoutChanges = (args) => {
        const { isSorting, wasDragging } = args;
        if (wasDragging) return false;
        if (isSorting) return true;
        return defaultAnimateLayoutChanges(args);
    };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: sortableId,
        animateLayoutChanges,
        data: {
            type: 'entry',
            entry,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        setView({ kind: 'detail', entryId: entry.id });
    };

    // Config-driven menu: confirm strategy auto-applied
    const handlers = confirmAction.wrapHandlers(
        TREE_ENTRY_MENU,
        {
            'add-to-section': () => {
                // Add to the first section, or navigate to page view if no sections
                if (sections.length > 0) {
                    sectionMutations.addEntryToSection(sections[0].id, entry.id);
                } else {
                    setView({ kind: 'page' });
                }
            },
            delete: () => {
                const cv = useDashboardStore.getState().contentView;
                if (cv.kind === 'detail' && cv.entryId === entry.id) {
                    setView({ kind: 'page' });
                }
                remove.mutate(entry.id);
            },
        },
        entry as unknown as Record<string, unknown>
    );
    const menuItems = resolveMenuItems(TREE_ENTRY_MENU, handlers);

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    'group relative flex cursor-pointer touch-none items-center rounded-md py-1 pl-5 pr-2 transition-colors',
                    isSelected
                        ? 'bg-dashboard-bg-active text-dashboard-text'
                        : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text',
                    isDragging && 'opacity-50'
                )}
                onClick={handleClick}
            >
                {/* Section indicator dot */}
                {isInSection && (
                    <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-400" />
                )}

                {/* Title */}
                <span className="ml-2 min-w-0 flex-1 truncate text-sm">
                    {entry.title || 'Untitled'}
                </span>

                {/* Right Side */}
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    {/* More menu */}
                    <SimpleDropdown
                        trigger={
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            </button>
                        }
                        items={menuItems}
                        contentClassName="w-44"
                    />
                </div>
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

export default memo(TreeItem);
