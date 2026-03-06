'use client';

import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useId, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Calendar, GripVertical } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';

import { useEntries, useEntryMutations } from '../../../hooks';
import { computeReorderedDisplay } from '../../../hooks/entries.api';
import { entryKeys } from '../../../hooks/use-editor-data';
import SortableItem from './SortableItem';

export default function PageListView() {
    const queryClient = useQueryClient();
    const { data: entries } = useEntries();
    const { reorderDisplay: reorderDisplayMutation } = useEntryMutations();

    const dndId = useId();
    const [activeId, setActiveId] = useState<string | null>(null);

    // Only entries with a numeric displayOrder, sorted by displayOrder (entries displayed on Page)
    // Exclude both null and undefined
    const displayedEntries = useMemo(
        () =>
            entries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!),
        [entries]
    );

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
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        // Reorder within Page (update displayOrder)
        const newIndex = displayedEntries.findIndex((e) => e.id === over.id);
        if (newIndex !== -1) {
            const updates = computeReorderedDisplay(entries, active.id as string, newIndex);
            if (updates) {
                // Sync cache update before mutate to prevent flash
                const orderMap = new Map(updates.map((u) => [u.id, u.displayOrder]));
                queryClient.setQueryData<ContentEntry[]>(entryKeys.all, (prev) =>
                    prev?.map((e) => {
                        const newOrder = orderMap.get(e.id);
                        return newOrder !== undefined ? { ...e, displayOrder: newOrder } : e;
                    })
                );
                reorderDisplayMutation.mutate({ updates });
            }
        }
    };

    const activeEntry = activeId ? displayedEntries.find((e) => e.id === activeId) : null;

    // Count of publicly visible entries (displayOrder !== null && isVisible)
    const visibleCount = displayedEntries.filter((e) => e.isVisible).length;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-dashboard-border/50 px-6 py-5">
                <h2 className="text-lg font-medium text-dashboard-text">Page layout</h2>
                <p className="mt-1 text-sm text-dashboard-text-muted">
                    Manage entries displayed on your public page. Drag to reorder.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-dashboard-text-muted">
                    <span>{displayedEntries.length} total</span>
                    <span>{visibleCount} visible</span>
                </div>
            </div>

            {/* List */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                {displayedEntries.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dashboard-bg-hover/40">
                                <Calendar className="h-6 w-6 text-dashboard-text-placeholder" />
                            </div>
                            <p className="text-sm font-medium text-dashboard-text-secondary">
                                Page is empty
                            </p>
                            <p className="mt-1 text-xs text-dashboard-text-placeholder">
                                Drag entries from the sidebar to add
                            </p>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        id={dndId}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={displayedEntries.map((entry) => entry.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {displayedEntries.map((entry) => (
                                    <SortableItem key={entry.id} entry={entry} />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                            {activeEntry && (
                                <div className="flex items-center gap-3 rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card p-3 shadow-xl">
                                    <div className="text-dashboard-text-placeholder">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <TypeBadge
                                        type={ENTRY_TYPE_CONFIG[activeEntry.type].badgeType}
                                        size="sm"
                                    />
                                    <span className="text-sm font-medium text-dashboard-text">
                                        {activeEntry.title || 'Untitled'}
                                    </span>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
