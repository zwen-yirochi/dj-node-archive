// app/dashboard/components/TreeSidebar/index.tsx
'use client';

import { TypeBadge } from '@/components/dna';
import { toast } from '@/hooks/use-toast';
import { useEditorData, useEntryMutations } from '../../hooks';
import { cn } from '@/lib/utils';
import { canAddToView } from '@/app/dashboard/config/entryFieldConfig';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useUserStore } from '@/stores/userStore';
import type { ContentEntry } from '@/types';

/** dnd-kit data 타입 — active.data.current의 구조를 선언 */
interface DragData {
    type: 'entry' | 'display-entry';
    entry: ContentEntry;
    displayEntryId?: string;
}

import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, FileText, Palette } from 'lucide-react';
import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import AccountSection from './AccountSection';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import ViewSection from './ViewSection';

export default function TreeSidebar() {
    // TanStack Query
    const { data } = useEditorData();
    const entries = data.contentEntries;

    // User Store
    const user = useUserStore((state) => state?.user);

    // TanStack Query Mutations
    const {
        remove: deleteEntryMutation,
        reorder: reorderEntriesMutation,
        addToDisplay: addToDisplayMutation,
        reorderDisplay: reorderDisplayMutation,
    } = useEntryMutations();

    // Dashboard Store
    const contentView = useDashboardStore((state) => state.contentView);
    const setView = useDashboardStore((state) => state.setView);
    const sidebarSections = useDashboardStore((state) => state.sidebarSections);
    const toggleSection = useDashboardStore((state) => state.toggleSection);

    // Derive sidebar highlight state from contentView
    const isBioActive = contentView.kind === 'bio';
    const isPageActive = contentView.kind === 'page' || contentView.kind === 'page-detail';
    const selectedEntryId = contentView.kind === 'detail' ? contentView.entryId : null;

    // 필터링 & 정렬
    const events = useMemo(
        () => entries.filter((e) => e.type === 'event').sort((a, b) => a.position - b.position),
        [entries]
    );

    const mixsets = useMemo(
        () => entries.filter((e) => e.type === 'mixset').sort((a, b) => a.position - b.position),
        [entries]
    );

    const links = useMemo(
        () => entries.filter((e) => e.type === 'link').sort((a, b) => a.position - b.position),
        [entries]
    );

    const displayedEntries = useMemo(
        () =>
            entries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!),
        [entries]
    );

    const dndId = useId();

    const [activeItem, setActiveItem] = useState<{
        entry: ContentEntry;
        isDisplayEntry: boolean;
        displayEntryId?: string;
    } | null>(null);

    const [isDraggingOverView, setIsDraggingOverView] = useState(false);

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

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as DragData | undefined;

        if (data?.entry) {
            setActiveItem({
                entry: data.entry,
                isDisplayEntry: data.type === 'display-entry',
                displayEntryId: data.displayEntryId,
            });
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setIsDraggingOverView(over?.id === 'view-drop-zone');
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setIsDraggingOverView(false);

        if (!over) return;

        const activeData = active.data.current as DragData | undefined;
        const overData = over.data.current as DragData | undefined;

        // View 드롭존에 드롭
        if (over.id === 'view-drop-zone' && activeData?.type === 'entry') {
            const entry = activeData.entry;

            if (!canAddToView(entry)) {
                console.warn('엔트리를 완성해야 Page에 추가할 수 있습니다.');
                return;
            }

            addToDisplayMutation.mutate(entry.id, {
                onError: () => toast({ variant: 'destructive', title: 'Failed to add to Page' }),
            });
            return;
        }

        // View 섹션 내 순서 변경
        if (activeData?.type === 'display-entry' && overData?.type === 'display-entry') {
            const activeEntry = activeData.entry;
            const overId = String(over.id).replace('view-', '');
            const newIndex = displayedEntries.findIndex((e) => e.id === overId);

            if (newIndex !== -1 && active.id !== over.id) {
                reorderDisplayMutation.mutate(
                    { entryId: activeEntry.id, newIndex },
                    { onError: () => toast({ variant: 'destructive', title: 'Failed to reorder' }) }
                );
            }
            return;
        }

        // 섹션 내 순서 변경
        if (activeData?.type === 'entry' && overData?.type === 'entry') {
            const activeEntry = activeData.entry;
            const overEntry = overData.entry;

            if (activeEntry.type === overEntry.type && active.id !== over.id) {
                const sectionType = activeEntry.type as 'event' | 'mixset' | 'link';

                let sectionEntries: ContentEntry[];
                if (sectionType === 'event') {
                    sectionEntries = events;
                } else if (sectionType === 'mixset') {
                    sectionEntries = mixsets;
                } else {
                    sectionEntries = links;
                }

                const overIndex = sectionEntries.findIndex((e) => e.id === over.id);
                if (overIndex !== -1) {
                    reorderEntriesMutation.mutate(
                        { type: sectionType, entryId: activeEntry.id, newPosition: overIndex },
                        {
                            onError: () =>
                                toast({ variant: 'destructive', title: 'Failed to reorder' }),
                        }
                    );
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        await deleteEntryMutation.mutateAsync(id);
    };

    const isPageCollapsed = sidebarSections?.page?.collapsed ?? false;

    const handlePageClick = () => {
        setView({ kind: 'page' });
    };

    const handlePageToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleSection('page');
    };

    // 로딩 상태
    if (!user || entries.length === 0) {
        return <TreeSidebarSkeleton />;
    }

    return (
        <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <aside className="flex h-full w-64 flex-col rounded-2xl bg-dashboard-bg-surface shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
                {/* Header */}
                <div className="px-4 py-4">
                    <Link
                        href="/"
                        className="font-display text-xl font-semibold text-dashboard-text"
                    >
                        DNA
                    </Link>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {/* Bio Design */}
                    <button
                        onClick={() => setView({ kind: 'bio' })}
                        className={cn(
                            'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            isBioActive
                                ? 'bg-dashboard-bg-active text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                        )}
                    >
                        <Palette className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm font-medium">Bio design</span>
                    </button>

                    {/* Page */}
                    <div
                        onClick={handlePageClick}
                        className={cn(
                            'group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            isPageActive
                                ? 'bg-dashboard-bg-active text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                        )}
                    >
                        <FileText className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm font-medium">Page</span>
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

                    {/* View Section */}
                    <div className="mb-3 ml-3">
                        <ViewSection
                            entries={displayedEntries}
                            isDraggingOver={isDraggingOverView}
                            isCollapsed={isPageCollapsed}
                            onDeleteEntry={handleDelete}
                        />
                    </div>

                    {/* Divider */}
                    <div className="my-3 border-t border-dashboard-border" />

                    {/* Components */}
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-placeholder">
                        Components
                    </p>

                    {/* Events */}
                    <SectionItem
                        section="events"
                        title="Events"
                        icon={<TypeBadge type="EVT" />}
                        count={events.length}
                        entryType="event"
                    >
                        <SortableContext
                            items={events.map((e) => e.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {events.map((entry) => (
                                    <TreeItem
                                        key={entry.id}
                                        entry={entry}
                                        onDelete={() => handleDelete(entry.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Mixsets */}
                    <SectionItem
                        section="mixsets"
                        title="Mixsets"
                        icon={<TypeBadge type="MIX" />}
                        count={mixsets.length}
                        entryType="mixset"
                    >
                        <SortableContext
                            items={mixsets.map((e) => e.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {mixsets.map((entry) => (
                                    <TreeItem
                                        key={entry.id}
                                        entry={entry}
                                        onDelete={() => handleDelete(entry.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Links */}
                    <SectionItem
                        section="links"
                        title="Links"
                        icon={<TypeBadge type="LNK" />}
                        count={links.length}
                        entryType="link"
                    >
                        <SortableContext
                            items={links.map((e) => e.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {links.map((entry) => (
                                    <TreeItem
                                        key={entry.id}
                                        entry={entry}
                                        onDelete={() => handleDelete(entry.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>
                </div>

                {/* Account Section */}
                <AccountSection username={user.username} />
            </aside>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-1 pl-8 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || '제목 없음'}
                        </span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

// Skeleton 컴포넌트
function TreeSidebarSkeleton() {
    return (
        <aside className="flex h-full w-64 flex-col rounded-2xl bg-dashboard-bg-surface p-4 shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
            <div className="animate-pulse space-y-4">
                <div className="h-6 w-20 rounded bg-gray-200" />
                <div className="space-y-2">
                    <div className="h-8 rounded bg-gray-200" />
                    <div className="h-8 rounded bg-gray-200" />
                    <div className="h-8 rounded bg-gray-200" />
                </div>
            </div>
        </aside>
    );
}
