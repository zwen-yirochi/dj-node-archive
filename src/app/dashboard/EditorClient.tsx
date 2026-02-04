// app/dashboard/EditorClient.tsx
'use client';

import { createEmptyComponent, eventToComponent } from '@/lib/transformers';
import { useComponentStore, type ViewItem } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { useViewStore } from '@/stores/viewStore';
import type { ComponentData, Theme, User } from '@/types';
import type { DBEventWithVenue } from '@/types/database';
import { useEffect, useState } from 'react';
import { AddComponentModal } from './components/AddComponentModal';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import TreeSidebar from './components/TreeSidebar';

interface EditorClientProps {
    initialUser: User;
    initialComponents: ComponentData[];
    initialViewItems?: ViewItem[];
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
    const components = useComponentStore((state) => state.components);
    const setComponents = useComponentStore((state) => state.setComponents);
    const setPageId = useComponentStore((state) => state.setPageId);
    const setTheme = useComponentStore((state) => state.setTheme);
    const saveComponent = useComponentStore((state) => state.saveComponent);
    const deleteComponent = useComponentStore((state) => state.deleteComponent);

    // View Store
    const setViewItems = useViewStore((state) => state.setViewItems);

    // UI Store
    const selectComponent = useUIStore((state) => state.selectComponent);
    const startCreating = useUIStore((state) => state.startCreating);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [_addingType, setAddingType] = useState<'show' | 'mixset' | 'link'>('show');

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
        type: 'show' | 'mixset' | 'link',
        eventData?: DBEventWithVenue
    ) => {
        setIsAddModalOpen(false);

        if (eventData) {
            // 이벤트 데이터가 있으면 변환하여 바로 저장 (이미 데이터가 있으므로 view 모드)
            const newComponent = eventToComponent(eventData);
            await saveComponent(newComponent);
            selectComponent(newComponent.id);
        } else {
            // 빈 컴포넌트 생성 후 즉시 DB에 저장 → 생성 모드 진입
            const newComponent = createEmptyComponent(type);
            await saveComponent(newComponent);
            startCreating(newComponent.id);
        }
    };

    // Add 버튼 클릭 핸들러
    const handleOpenAddModal = (type: 'show' | 'mixset' | 'link') => {
        setAddingType(type);
        setIsAddModalOpen(true);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* TreeSidebar - 왼쪽 */}
            <div className="p-3">
                <TreeSidebar
                    onAddComponent={handleOpenAddModal}
                    onDeleteComponent={deleteComponent}
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
