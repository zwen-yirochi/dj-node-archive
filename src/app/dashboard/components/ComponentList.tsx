// app/dashboard/components/ComponentList.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import type { DBEventWithVenue } from '@/types/database';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { AddComponentModal } from './AddComponentModal';
import ComponentDetail from './ComponentDetail';
import ComponentEditor from './ComponentEditor';
import SortableComponentCard from './SortableComponentCard';

export function ComponentList() {
    const components = useEditorStore((state) => state.components);
    const setComponents = useEditorStore((state) => state.setComponents);
    const pageId = useEditorStore((state) => state.pageId);

    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    // 상세정보 보기 중인 컴포넌트
    const [viewingComponent, setViewingComponent] = useState<ComponentData | null>(null);
    // 편집 중인 컴포넌트 (기존 컴포넌트 또는 새 컴포넌트)
    const [editingComponent, setEditingComponent] = useState<ComponentData | null>(null);
    const [isNewComponent, setIsNewComponent] = useState(false);

    const { sensors, handleDragStart, handleDragEnd, activeComponent } = useDragAndDrop(
        components,
        setComponents,
        pageId!
    );

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

    // AddComponentModal에서 호출
    const handleAddComponent = (type: 'show' | 'mixset' | 'link', eventData?: DBEventWithVenue) => {
        setIsAddMenuOpen(false);

        if (eventData) {
            // 이벤트 데이터가 있으면 변환하여 바로 저장
            const newComponent = eventToComponent(eventData);
            saveNewComponent(newComponent);
        } else {
            // 빈 컴포넌트로 에디터 열기
            const newComponent = createEmptyComponent(type);
            setEditingComponent(newComponent);
            setIsNewComponent(true);
        }
    };

    // 기존 컴포넌트 선택 (상세 보기)
    const handleSelectComponent = (component: ComponentData) => {
        setViewingComponent(component);
    };

    // 상세 보기에서 편집으로 전환
    const handleEditFromDetail = () => {
        if (viewingComponent) {
            setEditingComponent(viewingComponent);
            setIsNewComponent(false);
            setViewingComponent(null);
        }
    };

    // 컴포넌트 저장 (새 컴포넌트)
    const saveNewComponent = async (component: ComponentData) => {
        // 낙관적 업데이트
        const updatedComponents = [...components, component];
        setComponents(updatedComponents);

        try {
            const response = await fetch('/api/components', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, component }),
            });

            if (!response.ok) {
                // 실패 시 롤백
                setComponents(components);
                console.error('컴포넌트 추가 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            setComponents(components);
            console.error('컴포넌트 추가 오류:', error);
        }
    };

    // 컴포넌트 저장 (기존 컴포넌트 수정)
    const updateExistingComponent = async (component: ComponentData) => {
        const previousComponent = components.find((c) => c.id === component.id);
        if (!previousComponent) return;

        // 낙관적 업데이트
        const updatedComponents = components.map((c) => (c.id === component.id ? component : c));
        setComponents(updatedComponents);

        try {
            const response = await fetch(`/api/components/${component.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ component }),
            });

            if (!response.ok) {
                // 실패 시 롤백
                setComponents(
                    components.map((c) => (c.id === component.id ? previousComponent : c))
                );
                console.error('컴포넌트 수정 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            setComponents(components.map((c) => (c.id === component.id ? previousComponent : c)));
            console.error('컴포넌트 수정 오류:', error);
        }
    };

    // 에디터에서 저장
    const handleSave = async (component: ComponentData) => {
        if (isNewComponent) {
            await saveNewComponent(component);
        } else {
            await updateExistingComponent(component);
        }
    };

    // 컴포넌트 삭제
    const handleDelete = async (id: string) => {
        const deletedComponent = components.find((c) => c.id === id);
        if (!deletedComponent) return;

        // 낙관적 업데이트
        setComponents(components.filter((c) => c.id !== id));
        setViewingComponent(null);
        setEditingComponent(null);

        try {
            const response = await fetch(`/api/components/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // 실패 시 롤백
                setComponents(components);
                console.error('컴포넌트 삭제 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            setComponents(components);
            console.error('컴포넌트 삭제 오류:', error);
        }
    };

    const handleCloseEditor = () => {
        setEditingComponent(null);
        setIsNewComponent(false);
    };

    return (
        <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">Content</h2>
                <Button
                    onClick={() => setIsAddMenuOpen(true)}
                    size="sm"
                    className="h-8 rounded-lg bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={components.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {components.map((component) => (
                            <SortableComponentCard
                                key={component.id}
                                component={component}
                                isSelected={
                                    viewingComponent?.id === component.id ||
                                    editingComponent?.id === component.id
                                }
                                onSelect={() => handleSelectComponent(component)}
                                onDelete={() => handleDelete(component.id)}
                            />
                        ))}

                        {components.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 py-12 text-center backdrop-blur-sm">
                                <p className="mb-3 text-sm text-white/60">No content yet</p>
                                <Button
                                    onClick={() => setIsAddMenuOpen(true)}
                                    size="sm"
                                    className="h-8 rounded-lg bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add your first component
                                </Button>
                            </div>
                        )}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeComponent && (
                        <div className="rounded-xl border border-white/30 bg-black/70 p-3 shadow-2xl backdrop-blur-md">
                            <span
                                className={`inline-flex items-center gap-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    activeComponent.type === 'show'
                                        ? 'bg-[#ff2d92]/15 text-[#ff2d92]'
                                        : activeComponent.type === 'mixset'
                                          ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                                          : 'bg-[#a855f7]/15 text-[#a855f7]'
                                }`}
                            >
                                {activeComponent.type}
                            </span>
                            <p className="mt-1.5 truncate text-sm font-medium text-white/90">
                                {activeComponent.title || '제목 없음'}
                            </p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Component Detail Modal */}
            <AnimatePresence>
                {viewingComponent && (
                    <ComponentDetail
                        component={viewingComponent}
                        onEdit={handleEditFromDetail}
                        onDelete={() => handleDelete(viewingComponent.id)}
                        onClose={() => setViewingComponent(null)}
                    />
                )}
            </AnimatePresence>

            {/* Component Editor Modal */}
            <AnimatePresence>
                {editingComponent && (
                    <ComponentEditor
                        component={editingComponent}
                        isNew={isNewComponent}
                        onSave={handleSave}
                        onClose={handleCloseEditor}
                        onDelete={
                            isNewComponent ? undefined : () => handleDelete(editingComponent.id)
                        }
                    />
                )}
            </AnimatePresence>

            {/* Add Component Modal */}
            <AddComponentModal
                open={isAddMenuOpen}
                onOpenChange={setIsAddMenuOpen}
                onAddComponent={handleAddComponent}
            />
        </section>
    );
}
