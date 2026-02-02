// app/dashboard/EditorClient.tsx
'use client';

import { useEditorStore, type ViewItem } from '@/stores/editorStore';
import type { ComponentData, EventComponent, LinkComponent, MixsetComponent, User } from '@/types';
import type { DBEventWithVenue } from '@/types/database';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AddComponentModal } from './components/AddComponentModal';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import TreeSidebar from './components/TreeSidebar';

interface EditorClientProps {
    initialUser: User;
    initialComponents: ComponentData[];
    initialViewItems?: ViewItem[];
    pageId: string;
    username: string;
}

export default function EditorClient({
    initialUser,
    initialComponents,
    initialViewItems = [],
    pageId,
    username,
}: EditorClientProps) {
    const setUser = useEditorStore((state) => state.setUser);
    const setComponents = useEditorStore((state) => state.setComponents);
    const setPageId = useEditorStore((state) => state.setPageId);
    const setViewItems = useEditorStore((state) => state.setViewItems);
    const components = useEditorStore((state) => state.components);
    const selectComponent = useEditorStore((state) => state.selectComponent);
    const setEditMode = useEditorStore((state) => state.setEditMode);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [_addingType, setAddingType] = useState<'show' | 'mixset' | 'link'>('show');

    // Zustand 초기화
    useEffect(() => {
        setUser(initialUser);
        setComponents(initialComponents);
        setViewItems(initialViewItems);
        setPageId(pageId);
    }, [
        initialUser,
        initialComponents,
        initialViewItems,
        pageId,
        setUser,
        setComponents,
        setViewItems,
        setPageId,
    ]);

    // 이벤트 데이터를 EventComponent로 변환
    const eventToComponent = (event: DBEventWithVenue): EventComponent => ({
        id: uuidv4(),
        type: 'show',
        title: event.title || '',
        date: event.date,
        venue: event.venue?.name || '',
        posterUrl: event.data?.poster_url || '',
        lineup: event.data?.lineup_text?.split('\n').filter(Boolean) || [],
        description: event.data?.notes || '',
        links: event.data?.set_recording_url
            ? [{ title: '세트 녹음', url: event.data.set_recording_url }]
            : [],
    });

    // 빈 컴포넌트 템플릿 생성
    const createEmptyComponent = (type: 'show' | 'mixset' | 'link'): ComponentData => {
        const id = uuidv4();
        switch (type) {
            case 'show':
                return {
                    id,
                    type: 'show',
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    venue: '',
                    posterUrl: '',
                    lineup: [],
                    description: '',
                    links: [],
                } as EventComponent;
            case 'mixset':
                return {
                    id,
                    type: 'mixset',
                    title: '',
                    coverUrl: '',
                    audioUrl: '',
                    soundcloudEmbedUrl: '',
                    tracklist: [],
                    description: '',
                    releaseDate: new Date().toISOString().split('T')[0],
                    genre: '',
                } as MixsetComponent;
            case 'link':
                return {
                    id,
                    type: 'link',
                    title: '',
                    url: '',
                    icon: 'globe',
                } as LinkComponent;
        }
    };

    // 컴포넌트 추가 핸들러
    const handleAddComponent = (type: 'show' | 'mixset' | 'link', eventData?: DBEventWithVenue) => {
        setIsAddModalOpen(false);

        if (eventData) {
            // 이벤트 데이터가 있으면 변환하여 바로 저장
            const newComponent = eventToComponent(eventData);
            handleSaveComponent(newComponent);
        } else {
            // 빈 컴포넌트로 에디터 열기
            const newComponent = createEmptyComponent(type);
            // 임시로 컴포넌트 추가 후 선택하여 편집 모드로
            setComponents([...components, newComponent]);
            selectComponent(newComponent.id);
            setEditMode('edit');
        }
    };

    // 컴포넌트 저장
    const handleSaveComponent = async (component: ComponentData) => {
        const existingIndex = components.findIndex((c) => c.id === component.id);

        if (existingIndex === -1) {
            // 새 컴포넌트
            const updatedComponents = [...components, component];
            setComponents(updatedComponents);

            try {
                const response = await fetch('/api/components', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId, component }),
                });

                if (!response.ok) {
                    setComponents(components);
                    console.error('컴포넌트 추가 실패');
                }
            } catch (error) {
                setComponents(components);
                console.error('컴포넌트 추가 오류:', error);
            }
        } else {
            // 기존 컴포넌트 수정
            const previousComponent = components[existingIndex];
            const updatedComponents = components.map((c) =>
                c.id === component.id ? component : c
            );
            setComponents(updatedComponents);

            try {
                const response = await fetch(`/api/components/${component.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ component }),
                });

                if (!response.ok) {
                    setComponents(
                        components.map((c) => (c.id === component.id ? previousComponent : c))
                    );
                    console.error('컴포넌트 수정 실패');
                }
            } catch (error) {
                setComponents(
                    components.map((c) => (c.id === component.id ? previousComponent : c))
                );
                console.error('컴포넌트 수정 오류:', error);
            }
        }
    };

    // 컴포넌트 삭제
    const handleDeleteComponent = async (id: string) => {
        const deletedComponent = components.find((c) => c.id === id);
        if (!deletedComponent) return;

        setComponents(components.filter((c) => c.id !== id));

        try {
            const response = await fetch(`/api/components/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                setComponents(components);
                console.error('컴포넌트 삭제 실패');
            }
        } catch (error) {
            setComponents(components);
            console.error('컴포넌트 삭제 오류:', error);
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
                    onDeleteComponent={handleDeleteComponent}
                    username={username}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden p-3 pl-2">
                {/* ContentPanel - 중앙 */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-100/80 shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
                    <ContentPanel onSave={handleSaveComponent} onDelete={handleDeleteComponent} />
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
