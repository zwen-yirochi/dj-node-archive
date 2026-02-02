'use client';

import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/types';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Calendar, Compass, ExternalLink, Headphones, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AddButton from './AddButton';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import ViewSection from './ViewSection';

interface TreeSidebarProps {
    onAddComponent: (type: 'show' | 'mixset' | 'link') => void;
    username: string;
}

export default function TreeSidebar({ onAddComponent, username }: TreeSidebarProps) {
    const components = useEditorStore((state) => state.components);
    const addToView = useEditorStore((state) => state.addToView);
    const reorderView = useEditorStore((state) => state.reorderView);
    const viewItems = useEditorStore((state) => state.viewItems);

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
        // View 드롭존 위에 있는지 확인
        setIsDraggingOverView(over?.id === 'view-drop-zone');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setIsDraggingOverView(false);

        if (!over) return;

        const activeData = active.data.current;

        // View 드롭존에 드롭한 경우 - 컴포넌트를 View에 추가
        if (over.id === 'view-drop-zone' && activeData?.type === 'component') {
            addToView(activeData.component.id);
            return;
        }

        // View 섹션 내에서 순서 변경
        if (activeData?.type === 'view-item') {
            const overData = over.data.current;
            if (overData?.type === 'view-item') {
                const overIndex = viewItems.findIndex((item) => item.id === over.id);
                if (overIndex !== -1) {
                    reorderView(active.id as string, overIndex);
                }
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl">
                {/* Header - DNA 로고 */}
                <div className="border-b border-white/10 px-5 py-4">
                    <Link href="/" className="font-display text-2xl tracking-wide text-white">
                        DNA
                    </Link>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-y-auto px-2 py-3">
                    {/* View Section - 공개 페이지 배치 (드롭존) */}
                    <div className="mb-3 border-b border-white/10 pb-3">
                        <ViewSection isDraggingOver={isDraggingOverView} />
                    </div>

                    {/* Events Section */}
                    <SectionItem
                        section="events"
                        title="Events"
                        icon={<Calendar className="h-3.5 w-3.5" />}
                        count={events.length}
                        onAdd={() => onAddComponent('show')}
                    >
                        <SortableContext
                            items={events.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-0.5 py-1">
                                {events.map((component) => (
                                    <TreeItem key={component.id} component={component} />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Mixsets Section */}
                    <SectionItem
                        section="mixsets"
                        title="Mixsets"
                        icon={<Headphones className="h-3.5 w-3.5" />}
                        count={mixsets.length}
                        onAdd={() => onAddComponent('mixset')}
                    >
                        <SortableContext
                            items={mixsets.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-0.5 py-1">
                                {mixsets.map((component) => (
                                    <TreeItem key={component.id} component={component} />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>

                    {/* Links Section */}
                    <SectionItem
                        section="links"
                        title="Links"
                        icon={<LinkIcon className="h-3.5 w-3.5" />}
                        count={links.length}
                        onAdd={() => onAddComponent('link')}
                    >
                        <SortableContext
                            items={links.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-0.5 py-1">
                                {links.map((component) => (
                                    <TreeItem key={component.id} component={component} />
                                ))}
                            </div>
                        </SortableContext>
                    </SectionItem>
                </div>

                {/* Footer - Add Buttons */}
                <div className="space-y-1 border-t border-white/10 p-2">
                    <AddButton label="Add Event" onClick={() => onAddComponent('show')} />
                    <AddButton label="Add Mixset" onClick={() => onAddComponent('mixset')} />
                    <AddButton label="Add Link" onClick={() => onAddComponent('link')} />
                </div>

                {/* Bottom Navigation */}
                <div className="space-y-1 border-t border-white/10 p-3">
                    {/* Discovery */}
                    <Link
                        href="/discover"
                        target="_blank"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
                    >
                        <Compass className="h-4 w-4" />
                        <span>Discovery</span>
                        <ExternalLink className="ml-auto h-3.5 w-3.5 text-white/40" />
                    </Link>

                    {/* 내 페이지 보기 */}
                    <Link
                        href={`/${username}`}
                        target="_blank"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>내 페이지 보기</span>
                    </Link>
                </div>
            </aside>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem && (
                    <div className="rounded-lg border border-white/20 bg-black/80 px-3 py-2 shadow-xl backdrop-blur-md">
                        <span className="text-sm text-white/90">
                            {activeItem.component.title || '제목 없음'}
                        </span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
