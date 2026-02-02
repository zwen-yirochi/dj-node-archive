'use client';

import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/types';
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
import { Calendar, FileText, Headphones, Link as LinkIcon, Palette } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AccountSection from './AccountSection';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import ViewSection from './ViewSection';

interface TreeSidebarProps {
    onAddComponent: (type: 'show' | 'mixset' | 'link') => void;
    onDeleteComponent?: (id: string) => void;
    username: string;
}

export default function TreeSidebar({
    onAddComponent,
    onDeleteComponent,
    username,
}: TreeSidebarProps) {
    const components = useEditorStore((state) => state.components);
    const addToView = useEditorStore((state) => state.addToView);
    const reorderView = useEditorStore((state) => state.reorderView);
    const reorderSectionItems = useEditorStore((state) => state.reorderSectionItems);
    const viewItems = useEditorStore((state) => state.viewItems);
    const activePanel = useEditorStore((state) => state.activePanel);
    const setActivePanel = useEditorStore((state) => state.setActivePanel);

    // useMemo로 필터링하여 무한 루프 방지
    const events = useMemo(() => components.filter((c) => c.type === 'show'), [components]);
    const mixsets = useMemo(() => components.filter((c) => c.type === 'mixset'), [components]);
    const links = useMemo(() => components.filter((c) => c.type === 'link'), [components]);

    const [activeItem, setActiveItem] = useState<{
        component: ComponentData;
        isViewItem: boolean;
        viewItemId?: string;
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
        const data = active.data.current;

        if (data?.component) {
            setActiveItem({
                component: data.component,
                isViewItem: data.type === 'view-item',
                viewItemId: data.viewItemId,
            });
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setIsDraggingOverView(over?.id === 'view-drop-zone');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setIsDraggingOverView(false);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // View 드롭존에 드롭한 경우
        if (over.id === 'view-drop-zone' && activeData?.type === 'component') {
            addToView(activeData.component.id);
            return;
        }

        // View 섹션 내에서 순서 변경
        if (activeData?.type === 'view-item') {
            if (overData?.type === 'view-item') {
                const overIndex = viewItems.findIndex((item) => item.id === over.id);
                if (overIndex !== -1) {
                    reorderView(active.id as string, overIndex);
                }
            }
            return;
        }

        // 섹션 내 컴포넌트 순서 변경
        if (activeData?.type === 'component' && overData?.type === 'component') {
            const activeComponent = activeData.component as ComponentData;
            const overComponent = overData.component as ComponentData;

            if (activeComponent.type === overComponent.type && active.id !== over.id) {
                const sectionType = activeComponent.type as 'show' | 'mixset' | 'link';

                let sectionComponents: ComponentData[];
                if (sectionType === 'show') {
                    sectionComponents = events;
                } else if (sectionType === 'mixset') {
                    sectionComponents = mixsets;
                } else {
                    sectionComponents = links;
                }

                const overIndex = sectionComponents.findIndex((c) => c.id === over.id);
                if (overIndex !== -1) {
                    reorderSectionItems(sectionType, activeComponent.id, overIndex);
                }
            }
        }
    };

    const handleDelete = (componentId: string) => {
        onDeleteComponent?.(componentId);
    };

    const visibleCount = viewItems.filter((item) => item.isVisible).length;

    return (
        <DndContext
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
                        onClick={() => setActivePanel('bio')}
                        className={cn(
                            'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            activePanel === 'bio'
                                ? 'bg-dashboard-bg-active text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                        )}
                    >
                        <Palette className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm font-medium">Bio design</span>
                    </button>

                    {/* Page */}
                    <button
                        onClick={() => setActivePanel('page')}
                        className={cn(
                            'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            activePanel === 'page'
                                ? 'bg-dashboard-bg-active text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                        )}
                    >
                        <FileText className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm font-medium">Page</span>
                        {visibleCount > 0 && (
                            <span className="rounded bg-dashboard-bg-active px-1.5 py-0.5 text-[10px] font-medium text-dashboard-text-muted">
                                {visibleCount}
                            </span>
                        )}
                    </button>

                    {/* Page 드롭존 - Page 선택 시에만 확장 */}
                    {activePanel === 'page' && (
                        <div className="mb-3 ml-3">
                            <ViewSection
                                isDraggingOver={isDraggingOverView}
                                onDeleteComponent={handleDelete}
                            />
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-3 border-t border-dashboard-border" />

                    {/* Sub Level: Components */}
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-placeholder">
                        Components
                    </p>

                    {/* Events Section */}
                    <SectionItem
                        section="events"
                        title="Events"
                        icon={<Calendar className="h-4 w-4" />}
                        count={events.length}
                        onAdd={() => onAddComponent('show')}
                    >
                        <SortableContext
                            items={events.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {events.map((component, index) => (
                                    <TreeItem
                                        key={component.id}
                                        component={component}
                                        isLast={index === events.length - 1}
                                        onDelete={() => handleDelete(component.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Mixsets Section */}
                    <SectionItem
                        section="mixsets"
                        title="Mixsets"
                        icon={<Headphones className="h-4 w-4" />}
                        count={mixsets.length}
                        onAdd={() => onAddComponent('mixset')}
                    >
                        <SortableContext
                            items={mixsets.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {mixsets.map((component, index) => (
                                    <TreeItem
                                        key={component.id}
                                        component={component}
                                        isLast={index === mixsets.length - 1}
                                        onDelete={() => handleDelete(component.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Links Section */}
                    <SectionItem
                        section="links"
                        title="Links"
                        icon={<LinkIcon className="h-4 w-4" />}
                        count={links.length}
                        onAdd={() => onAddComponent('link')}
                    >
                        <SortableContext
                            items={links.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-0.5">
                                {links.map((component, index) => (
                                    <TreeItem
                                        key={component.id}
                                        component={component}
                                        isLast={index === links.length - 1}
                                        onDelete={() => handleDelete(component.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>
                </div>

                {/* Account Section - 하단 */}
                <AccountSection username={username} />
            </aside>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-2 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.component.title || '제목 없음'}
                        </span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
