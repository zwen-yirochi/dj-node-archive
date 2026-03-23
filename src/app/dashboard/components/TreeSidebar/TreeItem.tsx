'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import { AlertTriangle, MoreHorizontal } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { validateEntry } from '@/app/dashboard/config/entry/entry-validation';
import {
    resolveMenuItems,
    TREE_DELETE,
    type MenuConfig,
    type MenuItemConfig,
    type MenuSeparatorConfig,
} from '@/app/dashboard/config/ui/menu';
import { sortableAnimateLayoutChanges } from '@/app/dashboard/dnd/animate';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryMutations } from '../../hooks';
import { useConfirmAction } from '../../hooks/use-confirm-action';
import { usePageMeta } from '../../hooks/use-editor-data';
import { useSectionMutations } from '../../hooks/use-section-mutations';
import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TreeItemProps {
    entry: ContentEntry;
    isInSection: boolean;
}

function TreeItem({ entry, isInSection }: TreeItemProps) {
    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // Confirm action (config-driven)
    const confirmAction = useConfirmAction();

    // Mutations
    const { remove } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    // Sections data for dynamic menu
    const { data: pageMeta } = usePageMeta();
    const sections = pageMeta?.sections ?? [];

    const isSelected = contentView.kind === 'detail' && contentView.entryId === entry.id;
    const { isValid } = validateEntry(entry, 'create');

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: entry.id,
        animateLayoutChanges: sortableAnimateLayoutChanges,
        data: { type: 'entry', entry },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        setView({ kind: 'detail', entryId: entry.id });
    };

    // Dynamic section menu: show available sections for entry placement
    const SEPARATOR: MenuSeparatorConfig = { type: 'separator' };

    const availableSections = sections.filter((s) => {
        if (s.entryIds.includes(entry.id)) return false;
        if (s.viewType === 'feature' && s.entryIds.length >= 1) return false;
        return true;
    });

    const sectionMenuItems: (MenuItemConfig | MenuSeparatorConfig)[] = (() => {
        if (sections.length === 0) {
            return [{ actionKey: '_no-sections', label: 'No sections yet' }];
        }
        if (availableSections.length === 0) {
            return [{ actionKey: '_on-all', label: 'On all sections' }];
        }
        return availableSections.map((s) => ({
            actionKey: `add-to:${s.id}`,
            label: s.title || `${s.viewType.charAt(0).toUpperCase() + s.viewType.slice(1)} section`,
        }));
    })();

    const dynamicMenu: MenuConfig = [...sectionMenuItems, SEPARATOR, TREE_DELETE];

    // Build handlers dynamically
    const sectionHandlers: Record<string, () => void> = {};
    for (const s of availableSections) {
        sectionHandlers[`add-to:${s.id}`] = () => {
            sectionMutations.addEntryToSection(s.id, entry.id);
        };
    }
    sectionHandlers['_no-sections'] = () => {};
    sectionHandlers['_on-all'] = () => {};

    const allHandlers = confirmAction.wrapHandlers(
        dynamicMenu,
        {
            ...sectionHandlers,
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
    const menuItems = resolveMenuItems(dynamicMenu, allHandlers).map((item) => {
        if (
            'label' in item &&
            (item.label === 'No sections yet' || item.label === 'On all sections')
        ) {
            return { ...item, disabled: true };
        }
        return item;
    });

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
                    isDragging && 'drag-source-ghost'
                )}
                onClick={handleClick}
            >
                {/* Title */}
                <span className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm">
                    <span
                        className={cn(
                            'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                            isInSection ? 'bg-green-500/70' : 'bg-dashboard-text-placeholder/30'
                        )}
                        title={isInSection ? 'On page' : 'Not on page'}
                    />
                    {entry.title || 'Untitled'}
                </span>

                {/* Right: warning (default) → menu (hover) */}
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    {!isValid && (
                        <AlertTriangle className="h-3 w-3 text-amber-500/70 transition-opacity group-hover:opacity-0" />
                    )}
                    <SimpleDropdown
                        trigger={
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-dashboard-bg-active group-hover:opacity-100"
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
