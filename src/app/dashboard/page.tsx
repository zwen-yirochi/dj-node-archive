'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { useModal } from '@/hooks/useModal';
import { User } from '@/types';
import { AddComponentMenu } from './components/AddComponentMenu';
import ComponentEditor from './components/ComponentEditor';
import { ComponentList } from './components/ComponentList';
import { Header } from './components/Header';
import ProfileEditor from './components/ProfileEditor';
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
    const addMenu = useModal();
    const [showPreview, setShowPreview] = useState(true);

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
            <Header />

            <div
                className="editor-layout grid"
                style={{
                    gridTemplateColumns: '1fr 380px',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <main className={`overflow-y-auto bg-stone-200 p-8 md:block`}>
                    {/* 프로필 */}
                    <ProfileEditor user={user} onUpdate={updateUser} />
                    <ComponentList
                        components={components}
                        selectedComponentId={selectedComponentId}
                        onSelectComponent={setSelectedComponentId}
                        onDeleteComponent={deleteComponent}
                        onShowAddMenu={addMenu.open}
                        onDuplicateComponent={() => {}}
                        dragHandlers={{ onDragStart: handleDragStart, onDragEnd: handleDragEnd }}
                        sensors={sensors}
                        activeComponent={activeComponent}
                    />
                </main>
                <AddComponentMenu
                    isOpen={addMenu.isOpen}
                    onClose={addMenu.close}
                    onAddComponent={addComponent}
                />

                {/* Preview Panel */}
                <div className="border-2 border-red-500">
                    <AnimatePresence>
                        {showPreview && (
                            <motion.aside
                                className={`editor-preview lg:block`}
                                initial={{ x: 380 }}
                                animate={{ x: 0 }}
                                exit={{ x: 380 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                미리보기
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </div>

                {/* Component Editor Modal */}
                <AnimatePresence>
                    {selectedComponent && (
                        <ComponentEditor
                            component={selectedComponent}
                            onUpdate={(updates) => updateComponent(selectedComponentId!, updates)}
                            onClose={() => setSelectedComponentId(null)}
                            onDelete={() => deleteComponent(selectedComponentId!)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
