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
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useId, useMemo, useState } from 'react';

import { Calendar, Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';

import { useEntries, useEntryMutations } from '../../hooks';
import { computeReorderedDisplay } from '../../hooks/entries.api';

interface SortableItemProps {
    id: string;
    entry: ContentEntry;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onRemove: () => void;
    onSelect: () => void;
}

function SortableItem({
    id,
    entry,
    isVisible,
    onToggleVisibility,
    onRemove,
    onSelect,
}: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group flex items-center gap-3 rounded-lg border p-3 transition-all',
                isDragging
                    ? 'border-dashboard-border-hover shadow-lg'
                    : 'border-dashboard-border hover:border-dashboard-border-hover',
                !isVisible && 'opacity-60'
            )}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none text-dashboard-text-placeholder hover:text-dashboard-text-secondary active:cursor-grabbing"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Type Badge */}
            <TypeBadge type={config.badgeType} size="sm" />

            {/* Content */}
            <div className="min-w-0 flex-1 cursor-pointer" onClick={onSelect}>
                <p className="truncate text-sm font-medium text-dashboard-text">
                    {entry.title || '제목 없음'}
                </p>
                <p className="text-xs text-dashboard-text-muted">{config.label}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onToggleVisibility}
                    className={cn(
                        'rounded-md p-2 transition-colors',
                        isVisible
                            ? 'text-dashboard-text-muted hover:bg-dashboard-bg-muted hover:text-dashboard-text-secondary'
                            : 'text-dashboard-text-placeholder hover:bg-dashboard-bg-muted hover:text-dashboard-text-secondary'
                    )}
                    title={isVisible ? '숨기기' : '표시하기'}
                >
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                    onClick={onRemove}
                    className="rounded-md p-2 text-dashboard-text-placeholder transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Page에서 제거"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

interface PageListViewProps {
    onSelectDetail: (id: string) => void;
}

export default function PageListView({ onSelectDetail }: PageListViewProps) {
    // TanStack Query
    const { data: entries } = useEntries();
    const {
        toggleVisibility: toggleVisibilityMutation,
        removeFromDisplay: removeFromDisplayMutation,
        reorderDisplay: reorderDisplayMutation,
    } = useEntryMutations();

    const dndId = useId();
    const [activeId, setActiveId] = useState<string | null>(null);

    // displayOrder가 숫자인 엔트리만 displayOrder 순으로 정렬 (Page에 표시된 엔트리)
    // null과 undefined 모두 제외
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

        // Page 내 순서 변경 (displayOrder 업데이트)
        const newIndex = displayedEntries.findIndex((e) => e.id === over.id);
        if (newIndex !== -1) {
            const updates = computeReorderedDisplay(entries, active.id as string, newIndex);
            if (updates) {
                reorderDisplayMutation.mutate({ updates });
            }
        }
    };

    const handleToggleVisibility = (entryId: string) => {
        toggleVisibilityMutation.mutate(entryId);
    };

    const handleRemoveFromDisplay = (entryId: string) => {
        removeFromDisplayMutation.mutate(entryId);
    };

    const activeEntry = activeId ? displayedEntries.find((e) => e.id === activeId) : null;

    // 실제 공개 표시되는 엔트리 수 (displayOrder !== null && isVisible)
    const visibleCount = displayedEntries.filter((e) => e.isVisible).length;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b bg-dashboard-bg-muted px-6 py-4">
                <h2 className="text-lg font-semibold text-dashboard-text">Page 구성</h2>
                <p className="mt-1 text-sm text-dashboard-text-muted">
                    공개 페이지에 표시될 엔트리를 관리합니다. 드래그하여 순서를 변경하세요.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-dashboard-text-muted">
                    <span>전체 {displayedEntries.length}개</span>
                    <span>공개 {visibleCount}개</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {displayedEntries.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dashboard-bg-muted">
                                <Calendar className="h-8 w-8 text-dashboard-text-placeholder" />
                            </div>
                            <p className="text-sm font-medium text-dashboard-text-secondary">
                                Page가 비어있습니다
                            </p>
                            <p className="mt-1 text-xs text-dashboard-text-placeholder">
                                사이드바에서 엔트리를 드래그하여 추가하세요
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
                                    <SortableItem
                                        key={entry.id}
                                        id={entry.id}
                                        entry={entry}
                                        isVisible={entry.isVisible}
                                        onToggleVisibility={() => handleToggleVisibility(entry.id)}
                                        onRemove={() => handleRemoveFromDisplay(entry.id)}
                                        onSelect={() => onSelectDetail(entry.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay>
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
                                        {activeEntry.title || '제목 없음'}
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
