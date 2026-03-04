'use client';

import {
    defaultAnimateLayoutChanges,
    useSortable,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { AlertCircle, Check, MoreHorizontal } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entryConfig';
import {
    canAddToView,
    getMissingFieldLabels,
    getTreeItemStatus,
    type TreeItemStatus,
} from '@/app/dashboard/config/entryFieldConfig';
import {
    resolveTreeMenuItems,
    TREE_ENTRY_MENU,
    TREE_PAGE_DISPLAY_MENU,
    type TreeMenuActionContext,
} from '@/app/dashboard/config/menuConfig';
import { TypeBadge } from '@/components/dna';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';

interface TreeItemProps {
    entry: ContentEntry;
    isInPageDisplay?: boolean;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/** Status icon component */
function StatusIcon({
    status,
    missingFields,
}: {
    status: TreeItemStatus;
    missingFields: string[];
}) {
    switch (status) {
        case 'inView':
            return <Check className="h-3.5 w-3.5 text-dashboard-success" />;
        case 'warning':
            return (
                <span title={`Required to add to Page: ${missingFields.join(', ')}`}>
                    <AlertCircle className="h-3.5 w-3.5 text-dashboard-warning" />
                </span>
            );
        default:
            return null;
    }
}

export default function TreeItem({
    entry,
    isInPageDisplay = false,
    isVisible = true,
    onToggleVisibility,
    onEdit,
    onDelete,
}: TreeItemProps) {
    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // Compute status - numeric displayOrder means it's in the Page
    const isInView = typeof entry.displayOrder === 'number';
    const isValid = canAddToView(entry);
    const status = getTreeItemStatus(isInView, isValid);
    const missingFields = status === 'warning' ? getMissingFieldLabels(entry, 'create') : [];

    const isSelected = contentView.kind === 'detail' && contentView.entryId === entry.id;
    const config = ENTRY_TYPE_CONFIG[entry.type];

    // PageDisplayList uses 'view-{id}' format IDs (matches SortableContext)
    const sortableId = isInPageDisplay ? `view-${entry.id}` : entry.id;

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
            type: isInPageDisplay ? 'display-entry' : 'entry',
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

    // Resolve menu from config
    const menuActionCtx: TreeMenuActionContext = {
        onEdit: () => {
            setView({ kind: 'detail', entryId: entry.id });
            onEdit?.();
        },
        onDelete: () => onDelete?.(),
        onRemoveFromPage: () => onDelete?.(),
        onToggleVisibility: () => onToggleVisibility?.(),
        isVisible,
    };

    const menuItems = resolveTreeMenuItems(
        isInPageDisplay ? TREE_PAGE_DISPLAY_MENU : TREE_ENTRY_MENU,
        menuActionCtx
    );

    return (
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
                isDragging && 'opacity-50',
                !isVisible && 'opacity-50'
            )}
            onClick={handleClick}
        >
            {/* Type Badge - only shown in Page section */}
            {isInPageDisplay && <TypeBadge type={config.badgeType} size="sm" />}

            {/* Title */}
            <span className={cn('ml-2 min-w-0 flex-1 truncate text-sm', isInPageDisplay && 'ml-2')}>
                {entry.title || 'Untitled'}
            </span>

            {/* Right Side */}
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {/* Status icon (entry section only) - hidden on hover */}
                {!isInPageDisplay && (
                    <div className="absolute transition-opacity group-hover:opacity-0">
                        <StatusIcon status={status} missingFields={missingFields} />
                    </div>
                )}
                {/* More menu */}
                <SimpleDropdown
                    trigger={
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                'flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100',
                                !isInPageDisplay && 'absolute'
                            )}
                        >
                            <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        </button>
                    }
                    items={menuItems}
                    contentClassName="w-44"
                />
            </div>
        </div>
    );
}
