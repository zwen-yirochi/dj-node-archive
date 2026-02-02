'use client';

import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
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
import {
    Calendar,
    Eye,
    EyeOff,
    GripVertical,
    Headphones,
    Link as LinkIcon,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ComponentData } from '@/types';

const typeConfig = {
    show: {
        icon: Calendar,
        label: 'Event',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    mixset: {
        icon: Headphones,
        label: 'Mixset',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    link: {
        icon: LinkIcon,
        label: 'Link',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
};

interface SortableItemProps {
    id: string;
    component: ComponentData;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onRemove: () => void;
    onSelect: () => void;
}

function SortableItem({
    id,
    component,
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

    const config = typeConfig[component.type];
    const Icon = config.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group flex items-center gap-3 rounded-lg border bg-white p-3 transition-all',
                isDragging
                    ? 'border-neutral-300 shadow-lg'
                    : 'border-neutral-200 hover:border-neutral-300',
                !isVisible && 'opacity-60'
            )}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none text-neutral-400 hover:text-neutral-600 active:cursor-grabbing"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Type Badge */}
            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    config.bgColor
                )}
            >
                <Icon className={cn('h-4 w-4', config.color)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 cursor-pointer" onClick={onSelect}>
                <p className="truncate text-sm font-medium text-neutral-900">
                    {component.title || '제목 없음'}
                </p>
                <p className="text-xs text-neutral-500">{config.label}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onToggleVisibility}
                    className={cn(
                        'rounded-md p-2 transition-colors',
                        isVisible
                            ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                            : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
                    )}
                    title={isVisible ? '숨기기' : '표시하기'}
                >
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                    onClick={onRemove}
                    className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Page에서 제거"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function PageListView() {
    const viewItems = useEditorStore((state) => state.viewItems);
    const components = useEditorStore((state) => state.components);
    const reorderView = useEditorStore((state) => state.reorderView);
    const toggleViewItemVisibility = useEditorStore((state) => state.toggleViewItemVisibility);
    const removeFromView = useEditorStore((state) => state.removeFromView);
    const selectComponent = useEditorStore((state) => state.selectComponent);

    const [activeId, setActiveId] = useState<string | null>(null);

    const sortedViewItems = useMemo(
        () => [...viewItems].sort((a, b) => a.order - b.order),
        [viewItems]
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

        const overIndex = sortedViewItems.findIndex((item) => item.id === over.id);
        if (overIndex !== -1) {
            reorderView(active.id as string, overIndex);
        }
    };

    const activeItem = activeId ? sortedViewItems.find((item) => item.id === activeId) : null;
    const activeComponent = activeItem
        ? components.find((c) => c.id === activeItem.componentId)
        : null;

    const visibleCount = viewItems.filter((item) => item.isVisible).length;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">Page 구성</h2>
                <p className="mt-1 text-sm text-neutral-500">
                    공개 페이지에 표시될 컴포넌트를 관리합니다. 드래그하여 순서를 변경하세요.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                    <span>전체 {viewItems.length}개</span>
                    <span>공개 {visibleCount}개</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {sortedViewItems.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                                <Calendar className="h-8 w-8 text-neutral-400" />
                            </div>
                            <p className="text-sm font-medium text-neutral-600">
                                Page가 비어있습니다
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                사이드바에서 컴포넌트를 드래그하여 추가하세요
                            </p>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedViewItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {sortedViewItems.map((viewItem) => {
                                    const component = components.find(
                                        (c) => c.id === viewItem.componentId
                                    );
                                    if (!component) return null;

                                    return (
                                        <SortableItem
                                            key={viewItem.id}
                                            id={viewItem.id}
                                            component={component}
                                            isVisible={viewItem.isVisible}
                                            onToggleVisibility={() =>
                                                toggleViewItemVisibility(viewItem.id)
                                            }
                                            onRemove={() => removeFromView(viewItem.id)}
                                            onSelect={() => selectComponent(component.id)}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>

                        <DragOverlay>
                            {activeComponent && (
                                <div className="flex items-center gap-3 rounded-lg border border-neutral-300 bg-white p-3 shadow-xl">
                                    <div className="text-neutral-400">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                            typeConfig[activeComponent.type].bgColor
                                        )}
                                    >
                                        {(() => {
                                            const Icon = typeConfig[activeComponent.type].icon;
                                            return (
                                                <Icon
                                                    className={cn(
                                                        'h-4 w-4',
                                                        typeConfig[activeComponent.type].color
                                                    )}
                                                />
                                            );
                                        })()}
                                    </div>
                                    <span className="text-sm font-medium text-neutral-900">
                                        {activeComponent.title || '제목 없음'}
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
