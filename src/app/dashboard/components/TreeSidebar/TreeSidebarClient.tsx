// app/dashboard/components/TreeSidebar/TreeSidebarClient.tsx
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
import { useMemo, useState } from 'react';
import SectionItem from './SectionItem';
import TreeItem from './TreeItem';
import ViewSection from './ViewSection';

interface TreeSidebarClientProps {
    initialEvents: ContentEntry[];
    initialMixsets: ContentEntry[];
    initialLinks: ContentEntry[];
    initialDisplayedEntries: ContentEntry[];
    username: string;
    pageId: string;
}

export default function TreeSidebarClient({
    initialEvents,
    initialMixsets,
    initialLinks,
    initialDisplayedEntries,
    username,
    pageId,
}: TreeSidebarClientProps) {
    // Store에서 읽기
    const storeEntries = useContentEntryStore((state) => state.entries);
    const storePageId = useContentEntryStore((state) => state.pageId);

    // Store 액션
    const deleteEntry = useContentEntryStore((state) => state.deleteEntry);
    const reorderSectionItems = useContentEntryStore((state) => state.reorderSectionItems);
    const addToDisplay = useContentEntryStore((state) => state.addToDisplay);
    const reorderDisplayEntries = useContentEntryStore((state) => state.reorderDisplayEntries);
    const triggerPreviewRefresh = useContentEntryStore((state) => state.triggerPreviewRefresh);

    // UI Store
    const activePanel = useUIStore((state) => state.activePanel);
    const setActivePanel = useUIStore((state) => state.setActivePanel);
    const sidebarSections = useUIStore((state) => state.sidebarSections);
    const toggleSection = useUIStore((state) => state.toggleSection);

    // Store가 현재 페이지로 초기화되었는지 확인
    const isStoreReady =
        storePageId === pageId && Array.isArray(storeEntries) && storeEntries.length > 0;

    // Store 준비되면 Store 사용, 아니면 초기 Props 사용
    const events = useMemo(() => {
        if (isStoreReady) {
            return storeEntries
                .filter((e) => e.type === 'event')
                .sort((a, b) => a.position - b.position);
        }
        return initialEvents;
    }, [isStoreReady, storeEntries, initialEvents]);

    const mixsets = useMemo(() => {
        if (isStoreReady) {
            return storeEntries
                .filter((e) => e.type === 'mixset')
                .sort((a, b) => a.position - b.position);
        }
        return initialMixsets;
    }, [isStoreReady, storeEntries, initialMixsets]);

    const links = useMemo(() => {
        if (isStoreReady) {
            return storeEntries
                .filter((e) => e.type === 'link')
                .sort((a, b) => a.position - b.position);
        }
        return initialLinks;
    }, [isStoreReady, storeEntries, initialLinks]);

    const displayedEntries = useMemo(() => {
        if (isStoreReady) {
            return storeEntries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!);
        }
        return initialDisplayedEntries;
    }, [isStoreReady, storeEntries, initialDisplayedEntries]);

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setIsDraggingOverView(false);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // View 드롭존에 드롭
        if (over.id === 'view-drop-zone' && activeData?.type === 'entry') {
            const entry = activeData.entry as ContentEntry;

            if (!canAddToView(entry)) {
                console.warn('엔트리를 완성해야 Page에 추가할 수 있습니다.');
                return;
            }

            await addToDisplay(entry.id);
            return;
        }

        // View 섹션 내 순서 변경
        if (activeData?.type === 'display-entry' && overData?.type === 'display-entry') {
            const activeEntry = activeData.entry as ContentEntry;
            const displayedList = storeEntries
                .filter((e) => typeof e.displayOrder === 'number')
                .sort((a, b) => a.displayOrder! - b.displayOrder!);

            const overId = String(over.id).replace('view-', '');
            const newIndex = displayedList.findIndex((e) => e.id === overId);
            console.log(newIndex, active, over);
            if (newIndex !== -1 && active.id !== over.id) {
                console.log(3);
                await reorderDisplayEntries(activeEntry.id, newIndex);
            }
            return;
        }

        // 섹션 내 순서 변경
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
                    await reorderSectionItems(sectionType, activeEntry.id, overIndex);
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        const { triggeredPreview } = await deleteEntry(id);
        if (triggeredPreview) {
            triggerPreviewRefresh();
        }
    };

    const isPageCollapsed = sidebarSections.page.collapsed;

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

                {/* Mixsets */}
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

                {/* Links */}
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
