// app/dashboard/components/TreeSidebar/index.tsx
'use client';

import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useId, useMemo, useState } from 'react';
import Link from 'next/link';

import { useQueryClient } from '@tanstack/react-query';

import { ChevronDown, ChevronRight, FileText, Palette } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { type EntryType } from '@/app/dashboard/config/entry/entry-types';
import { COMPONENT_GROUPS } from '@/app/dashboard/config/ui/sidebar';
import { TypeBadge } from '@/components/dna';

import { useEntries, useEntryMutations, useUser } from '../../hooks';
import { computeReorderedPositions } from '../../hooks/entries.api';
import { entryKeys } from '../../hooks/use-editor-data';
import {
    selectContentView,
    selectSetView,
    selectSidebarSections,
    selectToggleSection,
    useDashboardStore,
} from '../../stores/dashboardStore';
import { CommandPalette } from '../ui/CommandPalette';
import AccountSection from './AccountSection';
import ComponentGroup from './ComponentGroup';
import TreeItem from './TreeItem';

/** dnd-kit data type — declares the structure of active.data.current */
interface DragData {
    type: 'entry';
    entry: ContentEntry;
}

export default function TreeSidebar() {
    // TanStack Query
    const queryClient = useQueryClient();
    const { data: entries } = useEntries();
    const user = useUser();

    // TanStack Query Mutations
    const { reorder: reorderEntriesMutation } = useEntryMutations();

    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);
    const sidebarSections = useDashboardStore(selectSidebarSections);
    const toggleSection = useDashboardStore(selectToggleSection);

    // Derive sidebar highlight state from contentView
    const isBioActive = contentView.kind === 'bio';
    const isPageActive = contentView.kind === 'page';

    // Filter & sort by type
    const entriesByType = useMemo(() => {
        const map: Record<string, ContentEntry[]> = {};
        for (const cfg of COMPONENT_GROUPS) {
            map[cfg.entryType] = entries
                .filter((e) => e.type === cfg.entryType)
                .sort((a, b) => a.position - b.position);
        }
        return map;
    }, [entries]);

    const dndId = useId();

    const [activeItem, setActiveItem] = useState<{
        entry: ContentEntry;
    } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /**
     * Custom collision detection that restricts targets to the same entry type.
     */
    const collisionDetection: CollisionDetection = useCallback((args) => {
        const activeData = args.active.data.current as DragData | undefined;

        if (activeData?.type === 'entry') {
            const filtered = args.droppableContainers.filter((container) => {
                const data = container.data.current as DragData | undefined;
                return data?.type === 'entry' && data.entry.type === activeData.entry.type;
            });
            return closestCenter({ ...args, droppableContainers: filtered });
        }

        return closestCenter(args);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as DragData | undefined;

        if (data?.entry) {
            setActiveItem({ entry: data.entry });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);

        if (!over) return;

        const activeData = active.data.current as DragData | undefined;
        const overData = over.data.current as DragData | undefined;

        // Reorder within a section
        if (activeData?.type === 'entry' && overData?.type === 'entry') {
            const activeEntry = activeData.entry;
            const overEntry = overData.entry;

            if (activeEntry.type === overEntry.type && active.id !== over.id) {
                const sectionType = activeEntry.type as EntryType;
                const sectionEntries = entriesByType[sectionType] ?? [];

                const overIndex = sectionEntries.findIndex((e) => e.id === over.id);
                if (overIndex !== -1) {
                    const updates = computeReorderedPositions(
                        entries,
                        sectionType,
                        activeEntry.id,
                        overIndex
                    );
                    if (updates) {
                        // Sync cache update before mutate to prevent flash
                        const posMap = new Map(updates.map((u) => [u.id, u.position]));
                        queryClient.setQueryData<ContentEntry[]>(entryKeys.all, (prev) =>
                            prev?.map((e) => {
                                const newPos = posMap.get(e.id);
                                return newPos !== undefined ? { ...e, position: newPos } : e;
                            })
                        );
                        reorderEntriesMutation.mutate(
                            { updates },
                            {
                                onError: () =>
                                    toast({ variant: 'destructive', title: 'Failed to reorder' }),
                            }
                        );
                    }
                }
            }
        }
    };

    const isPageCollapsed = sidebarSections?.page?.collapsed ?? false;

    const handlePageClick = () => {
        setView({ kind: 'page' });
    };

    const handlePageToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleSection('page');
    };

    return (
        <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <aside className="flex h-full w-64 shrink-0 flex-col bg-dashboard-bg-muted">
                {/* Header */}
                <div className="px-4 py-4">
                    <Link
                        href="/"
                        className="font-display text-xl font-semibold text-dashboard-text"
                    >
                        DNA
                    </Link>
                </div>

                {/* Search */}
                <div className="px-3 pb-2">
                    <CommandPalette />
                </div>

                {/* Tree Content */}
                <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
                    {/* Bio Design */}
                    <button
                        onClick={() => setView({ kind: 'bio' })}
                        className={cn(
                            'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            isBioActive
                                ? 'bg-dashboard-bg-active/70 font-medium text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover/70'
                        )}
                    >
                        <Palette className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm">Bio design</span>
                    </button>

                    {/* Page */}
                    <div
                        onClick={handlePageClick}
                        className={cn(
                            'group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            isPageActive
                                ? 'bg-dashboard-bg-active/70 font-medium text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover/70'
                        )}
                    >
                        <FileText className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm">Page</span>
                        <button
                            onClick={handlePageToggle}
                            className="flex h-4 w-4 items-center justify-center text-dashboard-text-placeholder hover:text-dashboard-text-muted"
                        >
                            {isPageCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>

                    {/* Placeholder for Page Display (disabled) */}
                    {!isPageCollapsed && (
                        <div className="mb-3 ml-3">
                            <p className="px-3 py-2 text-xs text-dashboard-text-placeholder">
                                섹션 편집은 다음 업데이트에서 지원됩니다.
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-2" />

                    {/* Components */}
                    <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-dashboard-text-placeholder">
                        Components
                    </p>

                    {/* Entry Sections */}
                    {COMPONENT_GROUPS.map((cfg) => {
                        const items = entriesByType[cfg.entryType] ?? [];
                        return (
                            <ComponentGroup
                                key={cfg.section}
                                section={cfg.section}
                                title={cfg.title}
                                icon={<TypeBadge type={cfg.badgeType} size="sm" />}
                                count={items.length}
                                entryType={cfg.entryType}
                            >
                                <SortableContext
                                    items={items.map((e) => e.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="py-0.5">
                                        {items.length === 0 ? (
                                            <SectionEmptyHint label={cfg.emptyLabel} />
                                        ) : (
                                            items.map((entry) => (
                                                <TreeItem key={entry.id} entry={entry} />
                                            ))
                                        )}
                                    </div>
                                </SortableContext>
                            </ComponentGroup>
                        );
                    })}
                </div>

                {/* Account Section */}
                <AccountSection username={user.username} />
            </aside>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeItem && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-1 pl-8 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || 'Untitled'}
                        </span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

function SectionEmptyHint({ label }: { label: string }) {
    return (
        <p className="py-2 pl-6 text-xs text-dashboard-text-placeholder">Use + to add {label}</p>
    );
}
