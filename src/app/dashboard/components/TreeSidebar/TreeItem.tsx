'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useRef, useState } from 'react';

import { AlertTriangle, MoreHorizontal } from 'lucide-react';

import type { ContentEntry, Section } from '@/types';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { validateEntry } from '@/app/dashboard/config/entry/entry-validation';
import { TREE_DELETE, type MenuConfig } from '@/app/dashboard/config/ui/menu';
import { sortableAnimateLayoutChanges } from '@/app/dashboard/dnd/animate';
import { formatSectionLabel, getAvailableSections } from '@/app/dashboard/utils/section-helpers';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useEntryMutations } from '../../hooks';
import { useConfirmAction } from '../../hooks/use-confirm-action';
import { useSectionMutations } from '../../hooks/use-section-mutations';
import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const MENU_CONTENT_CLASS =
    'rounded-lg border-dashboard-border/40 bg-white/90 shadow-md backdrop-blur-xl';

const DELETE_ONLY_MENU: MenuConfig = [TREE_DELETE];

interface TreeItemProps {
    entry: ContentEntry;
    isInSection: boolean;
    sections: Section[];
}

function TreeItem({ entry, isInSection, sections }: TreeItemProps) {
    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // Confirm action (config-driven)
    const confirmAction = useConfirmAction();

    // Mutations
    const { remove } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    const isSelected = contentView.kind === 'detail' && contentView.entryId === entry.id;
    const { isValid } = validateEntry(entry, 'create');

    // 메뉴 열림 상태 — 열려있으면 드래그 비활성화 (dnd-kit ↔ Radix 서브메뉴 충돌 방지)
    const [menuOpen, setMenuOpen] = useState(false);
    const menuClosedAtRef = useRef(0);

    const handleMenuChange = (open: boolean) => {
        setMenuOpen(open);
        if (!open) menuClosedAtRef.current = Date.now();
    };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: entry.id,
        animateLayoutChanges: sortableAnimateLayoutChanges,
        data: { type: 'entry', entry },
        disabled: menuOpen,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        // 메뉴가 닫힌 직후 클릭은 무시 (메뉴 닫힘 → click 버블링 방지)
        if (Date.now() - menuClosedAtRef.current < 200) return;
        setView({ kind: 'detail', entryId: entry.id });
    };

    // Available sections for "Add to section" submenu
    const availableSections = getAvailableSections(sections, entry.id);

    // Delete handler with confirm (reuse wrapHandlers for TREE_DELETE confirm strategy)
    const deleteHandlers = confirmAction.wrapHandlers(
        DELETE_ONLY_MENU,
        {
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
                            isInSection
                                ? 'bg-dashboard-success/80 ring-1 ring-dashboard-success/20'
                                : 'bg-dashboard-text-placeholder/20'
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
                    <DropdownMenu onOpenChange={handleMenuChange}>
                        <DropdownMenuTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-dashboard-bg-active group-hover:opacity-100"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className={cn('w-48', MENU_CONTENT_CLASS)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                    className="text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                                    disabled={sections.length === 0}
                                >
                                    Add to section
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent
                                        className={cn('w-44', MENU_CONTENT_CLASS)}
                                    >
                                        {sections.length === 0 ? (
                                            <DropdownMenuItem
                                                disabled
                                                className="text-dashboard-text-placeholder"
                                            >
                                                No sections yet
                                            </DropdownMenuItem>
                                        ) : availableSections.length === 0 ? (
                                            <DropdownMenuItem
                                                disabled
                                                className="text-dashboard-text-placeholder"
                                            >
                                                On all sections
                                            </DropdownMenuItem>
                                        ) : (
                                            availableSections.map((s) => (
                                                <DropdownMenuItem
                                                    key={s.id}
                                                    onClick={() =>
                                                        sectionMutations.addEntryToSection(
                                                            s.id,
                                                            entry.id
                                                        )
                                                    }
                                                    className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                                                >
                                                    {formatSectionLabel(s)}
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator className="bg-dashboard-border" />

                            <DropdownMenuItem
                                onClick={deleteHandlers.delete}
                                className="cursor-pointer text-dashboard-danger focus:bg-dashboard-danger-bg"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
