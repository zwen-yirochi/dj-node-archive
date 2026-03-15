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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useId, useState, type ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { ContentEntry } from '@/types/domain';
import { toast } from '@/hooks/use-toast';

import { useEntryMutations } from '../hooks';
import { computeReorderedPositions } from '../hooks/entries.api';
import { entryKeys, useEntries, usePageMeta } from '../hooks/use-editor-data';
import { useSectionMutations } from '../hooks/use-section-mutations';

interface DragData {
    type: 'entry' | 'sidebar-entry' | 'section' | 'section-entry' | 'section-drop';
    entry?: ContentEntry;
    sectionId?: string;
    section?: unknown;
}

export default function DashboardDndProvider({ children }: { children: ReactNode }) {
    const dndId = useId();
    const queryClient = useQueryClient();
    const { data: entries } = useEntries();
    const { data: pageMeta } = usePageMeta();
    const { reorder: reorderEntriesMutation } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    const [activeItem, setActiveItem] = useState<DragData | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const collisionDetection: CollisionDetection = useCallback((args) => {
        const activeData = args.active.data.current as DragData | undefined;

        // Sidebar entry sorting — restrict to same type
        if (activeData?.type === 'entry') {
            const filtered = args.droppableContainers.filter((c) => {
                const d = c.data.current as DragData | undefined;
                // Allow drop on same-type entries OR section drop targets
                if (d?.type === 'entry' && d.entry?.type === activeData.entry?.type) return true;
                if (d?.type === 'section-drop') return true;
                return false;
            });
            return closestCenter({ ...args, droppableContainers: filtered });
        }

        // Section sorting — restrict to sections
        if (activeData?.type === 'section') {
            const filtered = args.droppableContainers.filter((c) => {
                const d = c.data.current as DragData | undefined;
                return d?.type === 'section';
            });
            return closestCenter({ ...args, droppableContainers: filtered });
        }

        // Section entry / sidebar-entry — allow section drop targets
        return closestCenter(args);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as DragData | undefined;
        if (data) setActiveItem(data);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        if (!over) return;

        const activeData = active.data.current as DragData | undefined;
        const overData = over.data.current as DragData | undefined;
        if (!activeData || !overData) return;

        // 1. Sidebar entry reorder (within same type)
        if (activeData.type === 'entry' && overData.type === 'entry') {
            if (activeData.entry?.type === overData.entry?.type && active.id !== over.id) {
                const sectionEntries = entries
                    .filter((e) => e.type === activeData.entry!.type)
                    .sort((a, b) => a.position - b.position);
                const overIndex = sectionEntries.findIndex((e) => e.id === over.id);
                if (overIndex !== -1) {
                    const updates = computeReorderedPositions(
                        entries,
                        activeData.entry!.type,
                        activeData.entry!.id,
                        overIndex
                    );
                    if (updates) {
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
            return;
        }

        // 2. Sidebar entry → section (drop into section)
        if (activeData.type === 'entry' && overData.type === 'section-drop' && overData.sectionId) {
            if (activeData.entry) {
                sectionMutations.addEntryToSection(overData.sectionId, activeData.entry.id);
            }
            return;
        }

        // 3. Section reorder
        if (activeData.type === 'section' && overData.type === 'section') {
            const sections = pageMeta?.sections ?? [];
            const fromIndex = sections.findIndex((s) => s.id === active.id);
            const toIndex = sections.findIndex((s) => s.id === over.id);
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                sectionMutations.reorderSections(fromIndex, toIndex);
            }
            return;
        }

        // 4. Section entry reorder (within or between sections)
        if (activeData.type === 'section-entry' && activeData.sectionId && activeData.entry) {
            const activeSectionId = activeData.sectionId;
            const activeEntryId = activeData.entry.id;

            // Drop onto section-drop target
            if (overData.type === 'section-drop' && overData.sectionId) {
                if (activeSectionId !== overData.sectionId) {
                    sectionMutations.moveEntryBetweenSections(
                        activeSectionId,
                        overData.sectionId,
                        activeEntryId,
                        0
                    );
                }
                return;
            }

            // Drop onto another section-entry
            if (overData.type === 'section-entry' && overData.sectionId) {
                const overSectionId = overData.sectionId;
                const overEntryId = overData.entry?.id;
                if (!overEntryId) return;

                const sections = pageMeta?.sections ?? [];

                if (activeSectionId === overSectionId) {
                    // Same section reorder
                    const section = sections.find((s) => s.id === activeSectionId);
                    if (!section) return;
                    const fromIdx = section.entryIds.indexOf(activeEntryId);
                    const toIdx = section.entryIds.indexOf(overEntryId);
                    if (fromIdx !== -1 && toIdx !== -1) {
                        sectionMutations.reorderEntryInSection(activeSectionId, fromIdx, toIdx);
                    }
                } else {
                    // Cross-section move
                    const toSection = sections.find((s) => s.id === overSectionId);
                    if (!toSection) return;
                    const toIdx = toSection.entryIds.indexOf(overEntryId);
                    sectionMutations.moveEntryBetweenSections(
                        activeSectionId,
                        overSectionId,
                        activeEntryId,
                        toIdx
                    );
                }
            }
        }
    };

    return (
        <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {children}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeItem?.entry && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-1 pl-8 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || 'Untitled'}
                        </span>
                    </div>
                )}
                {activeItem?.type === 'section' && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-2 shadow-lg">
                        <span className="text-sm font-medium text-dashboard-text">Section</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
