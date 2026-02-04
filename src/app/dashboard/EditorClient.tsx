// app/dashboard/EditorClient.tsx
'use client';

import { createEmptyEntry, eventToEntry } from '@/lib/transformers';
import { useComponentStore } from '@/stores/componentStore';
import type { DisplayEntry } from '@/stores/viewStore';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { useViewStore } from '@/stores/viewStore';
import type { ContentEntry, Theme, User } from '@/types';
import type { DBEventWithVenue } from '@/types/database';
import { useEffect, useState } from 'react';
import { AddComponentModal } from './components/AddComponentModal';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import TreeSidebar from './components/TreeSidebar';

interface EditorClientProps {
    initialUser: User;
    initialComponents: ContentEntry[];
    initialViewItems?: DisplayEntry[];
    initialTheme?: Theme | null;
    pageId: string;
    username: string;
}

export default function EditorClient({
    initialUser,
    initialComponents,
    initialViewItems = [],
    initialTheme = null,
    pageId,
    username,
}: EditorClientProps) {
    // User Store
    const setUser = useUserStore((state) => state.setUser);

    // Component Store
    const setComponents = useComponentStore((state) => state.setComponents);
    const setPageId = useComponentStore((state) => state.setPageId);
    const setTheme = useComponentStore((state) => state.setTheme);
    const createComponent = useComponentStore((state) => state.createComponent);
    const finishCreating = useComponentStore((state) => state.finishCreating);
    const deleteComponentFromStore = useComponentStore((state) => state.deleteComponent);

    // View Store
    const setViewItems = useViewStore((state) => state.setViewItems);
    const triggerPreviewRefresh = useViewStore((state) => state.triggerPreviewRefresh);

    // UI Store
    const selectComponent = useUIStore((state) => state.selectComponent);
    const startCreating = useUIStore((state) => state.startCreating);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [_addingType, setAddingType] = useState<'event' | 'mixset' | 'link'>('event');

    // Zustand 초기화
    useEffect(() => {
        setUser(initialUser);
        setComponents(initialComponents);
        setViewItems(initialViewItems);
        setPageId(pageId);
        if (initialTheme) {
            setTheme(initialTheme);
        }
    }, [
        initialUser,
        initialComponents,
        initialViewItems,
        initialTheme,
        pageId,
        setUser,
        setComponents,
        setViewItems,
        setPageId,
        setTheme,
    ]);

    // 컴포넌트 추가 핸들러
    const handleAddComponent = async (
        type: 'event' | 'mixset' | 'link',
        eventData?: DBEventWithVenue
    ) => {
        setIsAddModalOpen(false);

        if (eventData) {
            // 이벤트 데이터가 있으면 변환하여 바로 저장 (이미 완성된 데이터)
            const newEntry = eventToEntry(eventData);
            await createComponent(newEntry);
            // 완성된 데이터이므로 바로 생성 완료 처리 + 미리보기 트리거
            finishCreating(newEntry.id);
            triggerPreviewRefresh();
            selectComponent(newEntry.id);
        } else {
            // 빈 엔트리 생성 후 즉시 DB에 저장 → 생성 모드 진입
            // createComponent는 newlyCreatedIds에 자동 추가
            const newEntry = createEmptyEntry(type);
            await createComponent(newEntry);
            startCreating(newEntry.id);
        }
    };

    // 컴포넌트 삭제 핸들러
    const handleDeleteComponent = async (id: string) => {
        const { triggeredPreview } = await deleteComponentFromStore(id);
        if (triggeredPreview) triggerPreviewRefresh();
    };

    // Add 버튼 클릭 핸들러
    const handleOpenAddModal = (type: 'event' | 'mixset' | 'link') => {
        setAddingType(type);
        setIsAddModalOpen(true);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* TreeSidebar - 왼쪽 */}
            <div className="p-3">
                <TreeSidebar
                    onAddComponent={handleOpenAddModal}
                    onDeleteComponent={handleDeleteComponent}
                    username={username}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden p-3 pl-2">
                {/* ContentPanel - 중앙 */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-dashboard-bg-card shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
                    <ContentPanel />
                </div>

                {/* PreviewPanel - 오른쪽 */}
                <aside className="w-[400px] shrink-0 overflow-hidden">
                    <PreviewPanel />
                </aside>
            </div>

            {/* Add Component Modal */}
            <AddComponentModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onAddComponent={handleAddComponent}
            />
        </div>
    );
}
