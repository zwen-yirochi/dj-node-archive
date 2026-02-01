// app/dashboard/components/ComponentList.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import type { DBEventWithVenue } from '@/types/database';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useComponentOperations } from '../hooks/useComponentOperations';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { AddComponentModal } from './AddComponentModal';
import ComponentEditor from './ComponentEditor';
import SortableComponentCard from './SortableComponentCard';

export function ComponentList() {
    const components = useEditorStore((state) => state.components);
    const setComponents = useEditorStore((state) => state.setComponents);
    const pageId = useEditorStore((state) => state.pageId);

    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const { sensors, handleDragStart, handleDragEnd, activeComponent } = useDragAndDrop(
        components,
        setComponents,
        pageId!
    );

    const { addComponent, updateComponent, deleteComponent, duplicateComponent } =
        useComponentOperations(
            components,
            setComponents,
            selectedComponentId,
            setSelectedComponentId,
            pageId!
        );

    const selectedComponent = components.find((c) => c.id === selectedComponentId);

    // ✓ AddComponentModal에서 사용할 핸들러
    const handleAddComponent = (type: 'show' | 'mixset' | 'link', eventData?: DBEventWithVenue) => {
        addComponent(type, eventData);
        setIsAddMenuOpen(false);
    };

    return (
        <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-primary">Content</h2>
                <Button onClick={() => setIsAddMenuOpen(true)} className="rounded-lg">
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
                                onDuplicate={() => duplicateComponent(component.id)}
                            />
                        ))}

                        {components.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 py-16 text-center">
                                <p className="mb-4 text-stone-500">No content yet</p>
                                <Button
                                    onClick={() => setIsAddMenuOpen(true)}
                                    variant="outline"
                                    className="rounded-lg"
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
                                className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                    activeComponent.type === 'show'
                                        ? 'bg-[#ff2d92]/15 text-[#ff2d92]'
                                        : activeComponent.type === 'mixset'
                                          ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                                          : 'bg-[#a855f7]/15 text-[#a855f7]'
                                }`}
                            >
                                {activeComponent.type}
                            </span>
                            <p className="mt-2 truncate font-medium text-stone-900">
                                {activeComponent.title || '제목 없음'}
                            </p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

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

            {/* Add Component Modal */}
            <AddComponentModal
                open={isAddMenuOpen}
                onOpenChange={setIsAddMenuOpen}
                onAddComponent={handleAddComponent}
            />
        </section>
    );
}
