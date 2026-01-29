'use client';

import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { Calendar, Link, Music, Plus } from 'lucide-react';
import ComponentEditor from './components/ComponentEditor';
import ProfileEditor from './components/ProfileEditor';
import SortableComponentCard from './components/SortableComponentCard';
import { useComponentOperations } from './hooks/useComponentOperations';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useEditorData } from './hooks/useEditorData';

// 임시: 편집할 사용자 (나중에 로그인으로 대체)
const EDIT_USERNAME = 'dj-xxx';

export default function EditorPage() {
    const { user, setUser, components, setComponents, pageId, loading } =
        useEditorData(EDIT_USERNAME);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    const { sensors, handleDragStart, handleDragEnd, activeComponent } = useDragAndDrop(
        components,
        setComponents
    );

    const { addComponent, updateComponent, deleteComponent } = useComponentOperations(
        components,
        setComponents,
        selectedComponentId,
        setSelectedComponentId
    );

    // 초기 상태 비우기
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'components' | 'style' | 'settings'>('components');
    const [mobileView, setMobileView] = useState<'sidebar' | 'canvas' | 'preview'>('canvas');
    const [showAddMenu, setShowAddMenu] = useState(false);

    const selectedComponent = components.find((c) => c.id === selectedComponentId) || null;

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...updates } : null));
    }, []);

    // 로딩 중
    if (loading) {
        return (
            <div className="bg-dark-bg flex min-h-screen items-center justify-center">
                <div className="text-warm-white text-xl">페이지 로딩 중...</div>
            </div>
        );
    }

    // 사용자 없음
    if (!user) {
        return (
            <div className="bg-dark-bg flex min-h-screen items-center justify-center">
                <div className="text-warm-white text-xl">페이지를 찾을 수 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="bg-stone-200 p-8 text-shadow-none">
            {/* 헤더 */}
            <header className="mb-12 flex items-start justify-between border-b border-white/5 p-0">
                <div>
                    <h1 className="font-display text-4xl text-primary">Dashboard</h1>
                </div>
            </header>

            <div
                className="editor-layout grid"
                style={{
                    gridTemplateColumns: '1fr 380px',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <main
                    className={`overflow-y-auto bg-stone-200 p-8 ${mobileView === 'canvas' ? 'block' : 'hidden'} md:block`}
                >
                    {/* 프로필 */}
                    <ProfileEditor user={user} onUpdate={updateUser} />

                    {/* 컴포넌트 리스트 */}
                    <section className="mb-12">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-primary">Content</h2>
                            <Button
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                className="rounded-lg"
                            >
                                <Plus className="h-4 w-4" />
                                Add component
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
                                <div className="space-y-4">
                                    {components.map((component) => (
                                        <SortableComponentCard
                                            key={component.id}
                                            component={component}
                                            isSelected={selectedComponentId === component.id}
                                            onSelect={() => setSelectedComponentId(component.id)}
                                            onDelete={() => deleteComponent(component.id)}
                                            onDuplicate={() => {}}
                                        />
                                    ))}

                                    {components.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <p className="mb-4 text-stone-500">No content yet</p>
                                            <Button
                                                onClick={() => setShowAddMenu(true)}
                                                variant="outline"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add your first component
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SortableContext>

                            <DragOverlay>
                                {activeComponent && (
                                    <div className="rounded-xl border-2 border-stone-900 bg-white p-4 opacity-90 shadow-2xl">
                                        <span
                                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${activeComponent.type === 'show' ? 'bg-[#ff2d92]/15 text-[#ff2d92]' : ''} ${activeComponent.type === 'mixset' ? 'bg-[#00f0ff]/15 text-[#00f0ff]' : ''} ${activeComponent.type === 'link' ? 'bg-[#a855f7]/15 text-[#a855f7]' : ''} `}
                                        >
                                            {activeComponent.type}
                                        </span>
                                        <p className="mt-2 truncate font-medium text-stone-900">
                                            {(activeComponent as any).title || '제목 없음'}
                                        </p>
                                    </div>
                                )}
                            </DragOverlay>
                        </DndContext>
                    </section>
                </main>
                {showAddMenu && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
                        onClick={() => setShowAddMenu(false)}
                    >
                        <div
                            className="w-96 rounded-xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-4 text-lg font-semibold">Add Component</h3>
                            <div className="space-y-2">
                                <Button
                                    onClick={() => {
                                        addComponent('show');
                                        setShowAddMenu(false);
                                    }}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Show / Event
                                </Button>
                                <Button
                                    onClick={() => {
                                        addComponent('mixset');
                                        setShowAddMenu(false);
                                    }}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Music className="mr-2 h-4 w-4" />
                                    Mixset
                                </Button>
                                <Button
                                    onClick={() => {
                                        addComponent('link');
                                        setShowAddMenu(false);
                                    }}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Link className="mr-2 h-4 w-4" />
                                    Link
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Preview Panel */}
                <div className="border-2 border-red-500">
                    <AnimatePresence>
                        {showPreview && (
                            <motion.aside
                                className={`editor-preview ${mobileView === 'preview' ? 'block' : 'hidden'} lg:block`}
                                initial={{ x: 380 }}
                                animate={{ x: 0 }}
                                exit={{ x: 380 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                미리보기
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Component Editor Modal */}
                    <AnimatePresence>
                        {selectedComponent && (
                            <ComponentEditor
                                component={selectedComponent}
                                onUpdate={(updates) =>
                                    updateComponent(selectedComponentId!, updates)
                                }
                                onClose={() => setSelectedComponentId(null)}
                                onDelete={() => deleteComponent(selectedComponentId!)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
