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
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { ContentEntry, Section } from '@/types/domain';
import { toast } from '@/hooks/use-toast';

import { useEntryMutations } from '../hooks';
import { computeReorderedPositions } from '../hooks/entries.api';
import { entryKeys, pageKeys, type PageMeta } from '../hooks/use-editor-data';
import { useSectionMutations } from '../hooks/use-section-mutations';

interface DragData {
    type: 'entry' | 'sidebar-entry' | 'section' | 'section-entry' | 'section-drop';
    entry?: ContentEntry;
    sectionId?: string;
    section?: Section;
}

export default function DashboardDndProvider({ children }: { children: ReactNode }) {
    const dndId = useId();
    const queryClient = useQueryClient();
    const { reorder: reorderEntriesMutation } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    // Read from cache imperatively — no subscription, no re-renders
    const getEntries = useCallback(
        () => queryClient.getQueryData<ContentEntry[]>(entryKeys.all) ?? [],
        [queryClient]
    );
    const getPageMeta = useCallback(
        () => queryClient.getQueryData<PageMeta>(pageKeys.all),
        [queryClient]
    );

    const [dragState, setDragState] = useState<{ item: DragData; width: number | null } | null>(
        null
    );
    const activeItem = dragState?.item ?? null;
    const dragWidth = dragState?.width ?? null;
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
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

    const dragReadyRef = useRef(false);
    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as DragData | undefined;
        if (data) {
            // Get dimensions from the actual DOM node
            const el = document.getElementById(`section-${event.active.id}`);
            const rect = el?.getBoundingClientRect();
            setDragState({
                item: data,
                width: rect?.width ?? null,
            });
            lastOverIdRef.current = null;
            // Block onDragOver reorders until initial drag animation settles
            dragReadyRef.current = false;
            requestAnimationFrame(() => {
                dragReadyRef.current = true;
            });
        }
    };

    // Live reorder during drag — cache only, no server save
    const lastOverIdRef = useRef<string | null>(null);
    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            if (!dragReadyRef.current) return;
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            // Skip if hovering over the same target as last time
            if (lastOverIdRef.current === over.id) return;
            lastOverIdRef.current = String(over.id);

            const activeData = active.data.current as DragData | undefined;
            const overData = over.data.current as DragData | undefined;
            if (activeData?.type !== 'section' || overData?.type !== 'section') return;

            sectionMutations.setSections((prev) => {
                const fromIndex = prev.findIndex((s) => s.id === active.id);
                const toIndex = prev.findIndex((s) => s.id === over!.id);
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
                const next = [...prev];
                const [moved] = next.splice(fromIndex, 1);
                next.splice(toIndex, 0, moved);
                return next;
            });
        },
        [sectionMutations]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDragState(null);

        if (!over) return;

        const activeData = active.data.current as DragData | undefined;
        const overData = over.data.current as DragData | undefined;
        if (!activeData || !overData) return;

        // 1. Sidebar entry reorder
        if (activeData.type === 'entry' && overData.type === 'entry') {
            if (activeData.entry?.type === overData.entry?.type && active.id !== over.id) {
                const currentEntries = getEntries();
                const sectionEntries = currentEntries
                    .filter((e) => e.type === activeData.entry!.type)
                    .sort((a, b) => a.position - b.position);
                const overIndex = sectionEntries.findIndex((e) => e.id === over.id);
                if (overIndex !== -1) {
                    const updates = computeReorderedPositions(
                        currentEntries,
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

        // 2. Sidebar entry → section drop
        if (activeData.type === 'entry' && overData.type === 'section-drop' && overData.sectionId) {
            if (activeData.entry) {
                sectionMutations.addEntryToSection(overData.sectionId, activeData.entry.id);
            }
            return;
        }

        // 3. Section reorder — already reordered in onDragOver, just save
        if (activeData.type === 'section' && overData.type === 'section') {
            sectionMutations.saveMutation.mutate();
            return;
        }

        // 4. Section entry reorder
        if (activeData.type === 'section-entry' && activeData.sectionId && activeData.entry) {
            const activeSectionId = activeData.sectionId;
            const activeEntryId = activeData.entry.id;

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

            if (overData.type === 'section-entry' && overData.sectionId) {
                const overSectionId = overData.sectionId;
                const overEntryId = overData.entry?.id;
                if (!overEntryId) return;

                const sections = getPageMeta()?.sections ?? [];

                if (activeSectionId === overSectionId) {
                    const section = sections.find((s) => s.id === activeSectionId);
                    if (!section) return;
                    const fromIdx = section.entryIds.indexOf(activeEntryId);
                    const toIdx = section.entryIds.indexOf(overEntryId);
                    if (fromIdx !== -1 && toIdx !== -1) {
                        sectionMutations.reorderEntryInSection(activeSectionId, fromIdx, toIdx);
                    }
                } else {
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
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {children}
            <DragOverlay dropAnimation={null}>
                {activeItem?.entry && (
                    <div className="animate-[fade-in_150ms_ease-out] rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-1 pl-8 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || 'Untitled'}
                        </span>
                    </div>
                )}
                {activeItem?.type === 'section' && activeItem.section && (
                    <div
                        className="animate-[fade-in_150ms_ease-out] rounded-xl border border-dashboard-border bg-dashboard-bg-card px-3 py-2.5 shadow-xl"
                        style={{ width: dragWidth ?? undefined }}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-sm font-medium ${activeItem.section.title ? 'text-dashboard-text' : 'text-dashboard-text-placeholder'}`}
                            >
                                {activeItem.section.title || 'Section title (optional)'}
                            </span>
                            <span className="text-xs text-dashboard-text-placeholder">
                                {activeItem.section.entryIds.length} items
                            </span>
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
