'use client';

import { cn } from '@/lib/utils';
import { canAddToView } from '@/lib/validators';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
import type { ContentEntry } from '@/types';
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
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    FileText,
    Headphones,
    Link as LinkIcon,
    Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AccountSection from './AccountSection';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import ViewSection from './ViewSection';

interface TreeSidebarProps {
    onDeleteEntry?: (id: string) => void;
    username: string;
}

export default function TreeSidebar({ onDeleteEntry, username }: TreeSidebarProps) {
    // Content Entry Store
    const entries = useContentEntryStore((state) => state.entries);
    const pageId = useContentEntryStore((state) => state.pageId);
    const reorderSectionItems = useContentEntryStore((state) => state.reorderSectionItems);
    const addToDisplay = useContentEntryStore((state) => state.addToDisplay);

    // UI Store
    const activePanel = useUIStore((state) => state.activePanel);
    const setActivePanel = useUIStore((state) => state.setActivePanel);
    const sidebarSections = useUIStore((state) => state.sidebarSections);
    const toggleSection = useUIStore((state) => state.toggleSection);

    // Page 섹션 접힘 상태
    const isPageCollapsed = sidebarSections.page.collapsed;

    // useMemo로 필터링하여 무한 루프 방지
    const events = useMemo(() => entries.filter((e) => e.type === 'event'), [entries]);
    const mixsets = useMemo(() => entries.filter((e) => e.type === 'mixset'), [entries]);
    const links = useMemo(() => entries.filter((e) => e.type === 'link'), [entries]);

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
        const data = active.data.current;

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setIsDraggingOverView(false);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // View 드롭존에 드롭한 경우 - is_visible = true로 설정
        if (over.id === 'view-drop-zone' && activeData?.type === 'entry') {
            const entry = activeData.entry as ContentEntry;
            // 유효성 검사: 필수 필드가 채워진 엔트리만 View에 추가 가능
            if (!canAddToView(entry)) {
                // TODO: Toast로 사용자에게 알림
                console.warn('엔트리를 완성해야 Page에 추가할 수 있습니다.');
                return;
            }
            // entries.is_visible = true로 설정
            addToDisplay(entry.id);
            return;
        }

        // View 섹션 내에서 순서 변경 (display-entry 타입)
        // TODO: View 내 순서 변경 기능 구현 (position 업데이트)
        if (activeData?.type === 'display-entry') {
            // 현재는 position 기반 reorder 미구현
            // 필요시 reorderViewItems 액션 추가 필요
            return;
        }

        // 섹션 내 엔트리 순서 변경
        if (activeData?.type === 'entry' && overData?.type === 'entry') {
            const activeEntry = activeData.entry as ContentEntry;
            const overEntry = overData.entry as ContentEntry;

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
                    reorderSectionItems(sectionType, activeEntry.id, overIndex);
                }
            }
        }
    };

    const handleDelete = (entryId: string) => {
        onDeleteEntry?.(entryId);
    };

    const handlePageClick = () => {
        setActivePanel('page');
    };

    const handlePageToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleSection('page');
    };

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

                    {/* Page - 클릭하면 패널 전환, 화살표 클릭하면 접기/펼치기 */}
                    <div
                        onClick={handlePageClick}
                        className={cn(
                            'group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            activePanel === 'page'
                                ? 'bg-dashboard-bg-active text-dashboard-text'
                                : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                        )}
                    >
                        <FileText className="h-4 w-4 text-dashboard-text-muted" />
                        <span className="flex-1 text-sm font-medium">Page</span>
                        {/* {visibleCount > 0 && (
                            <span className="rounded bg-dashboard-bg-active px-1.5 py-0.5 text-[10px] font-medium text-dashboard-text-muted">
                                {visibleCount}
                            </span>
                        )} */}
                        {/* 접기/펼치기 화살표 */}
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

                    {/* Page ViewSection - 항상 렌더링 (드롭 가능), 접힘 상태에 따라 표시 */}
                    <div className="mb-3 ml-3">
                        <ViewSection
                            isDraggingOver={isDraggingOverView}
                            isCollapsed={isPageCollapsed}
                            onDeleteEntry={handleDelete}
                        />
                    </div>

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

                    {/* Mixsets Section */}
                    <SectionItem
                        section="mixsets"
                        title="Mixsets"
                        icon={<Headphones className="h-4 w-4" />}
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

                    {/* Links Section */}
                    <SectionItem
                        section="links"
                        title="Links"
                        icon={<LinkIcon className="h-4 w-4" />}
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

                {/* Account Section - 하단 */}
                <AccountSection username={username} />
            </aside>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-2 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || '제목 없음'}
                        </span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
