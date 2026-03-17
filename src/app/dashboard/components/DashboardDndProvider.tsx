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
import { useCallback, useId, useMemo, useState, type ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { ContentEntry } from '@/types/domain';
import { defaultDropAnimation } from '@/app/dashboard/dnd/animate';
import { dashboardStrategies } from '@/app/dashboard/dnd/strategies';
import type { DragContext, DragData } from '@/app/dashboard/dnd/types';

import { useEntryMutations } from '../hooks';
import { entryKeys, pageKeys, type PageMeta } from '../hooks/use-editor-data';
import { useSectionMutations } from '../hooks/use-section-mutations';

export default function DashboardDndProvider({ children }: { children: ReactNode }) {
    const dndId = useId();
    const queryClient = useQueryClient();
    const { reorder: reorderEntriesMutation } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    const getEntries = useCallback(
        () => queryClient.getQueryData<ContentEntry[]>(entryKeys.all) ?? [],
        [queryClient]
    );
    const getPageMeta = useCallback(
        () => queryClient.getQueryData<PageMeta>(pageKeys.all),
        [queryClient]
    );

    const ctx: DragContext = useMemo(
        () => ({
            getEntries,
            getPageMeta,
            queryClient,
            reorderEntriesMutation,
            sectionMutations,
        }),
        [getEntries, getPageMeta, queryClient, reorderEntriesMutation, sectionMutations]
    );

    // ── Drag state (for DragOverlay) ──
    const [dragState, setDragState] = useState<{ item: DragData; width: number | null } | null>(
        null
    );
    const activeItem = dragState?.item ?? null;
    const dragWidth = dragState?.width ?? null;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── Strategy-based collision detection ──
    const collisionDetection: CollisionDetection = useCallback((args) => {
        const activeData = args.active.data.current as DragData | undefined;
        if (!activeData) return closestCenter(args);

        const strategy = dashboardStrategies.find((s) => s.activeTypes.includes(activeData.type));
        if (!strategy) return closestCenter(args);

        const filtered = args.droppableContainers.filter((c) => {
            const overData = c.data.current as DragData | undefined;
            if (!overData) return false;
            return strategy.acceptsOver(activeData, overData);
        });
        return closestCenter({ ...args, droppableContainers: filtered });
    }, []);

    // ── Drag lifecycle ──
    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as DragData | undefined;
        if (data) {
            const el = document.getElementById(`section-${event.active.id}`);
            const rect = el?.getBoundingClientRect();
            setDragState({ item: data, width: rect?.width ?? null });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDragState(null);
        if (!event.over) return;

        const activeData = event.active.data.current as DragData | undefined;
        if (!activeData) return;

        const strategy = dashboardStrategies.find((s) => s.activeTypes.includes(activeData.type));
        strategy?.onEnd(event, ctx);
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
            <DragOverlay dropAnimation={defaultDropAnimation}>
                {activeItem?.entry && (
                    <div className="drag-overlay-card px-3 py-1 pl-8">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || 'Untitled'}
                        </span>
                    </div>
                )}
                {activeItem?.type === 'section' && activeItem.section && (
                    <div
                        className="drag-overlay-card rounded-xl px-3 py-2.5 shadow-xl"
                        style={{ width: dragWidth ?? undefined }}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-sm font-medium ${activeItem.section.title || (activeItem.section.viewType === 'feature' && activeItem.section.entryIds.length > 0) ? 'text-dashboard-text' : 'text-dashboard-text-placeholder'}`}
                            >
                                {activeItem.section.viewType === 'feature'
                                    ? getEntries().find(
                                          (e) => e.id === activeItem.section!.entryIds[0]
                                      )?.title || 'No entry'
                                    : activeItem.section.title || 'Section title (optional)'}
                            </span>
                            <span className="text-xs text-dashboard-text-placeholder">
                                {activeItem.section.viewType === 'feature'
                                    ? 'Feature'
                                    : `${activeItem.section.entryIds.length} items`}
                            </span>
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
