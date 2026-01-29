import { Button } from '@/components/ui/button';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import SortableComponentCard from './SortableComponentCard';

interface ComponentListProps {
    components: any[];
    selectedComponentId: string | null;
    onSelectComponent: (id: string) => void;
    onDeleteComponent: (id: string) => void;
    onDuplicateComponent: (id: string) => void;
    onShowAddMenu: () => void;
    dragHandlers: {
        onDragStart: (event: any) => void;
        onDragEnd: (event: any) => void;
    };
    sensors: any;
    activeComponent?: any; // 드래그 중인 컴포넌트
}

export function ComponentList({
    components,
    selectedComponentId,
    onSelectComponent,
    onDeleteComponent,
    onDuplicateComponent,
    onShowAddMenu,
    dragHandlers,
    sensors,
    activeComponent,
}: ComponentListProps) {
    return (
        <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-primary">Content</h2>
                <Button onClick={onShowAddMenu} className="rounded-lg">
                    <Plus className="h-4 w-4" />
                    Add component
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={dragHandlers.onDragStart}
                onDragEnd={dragHandlers.onDragEnd}
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
                                onSelect={() => onSelectComponent(component.id)}
                                onDelete={() => onDeleteComponent(component.id)}
                                onDuplicate={() => onDuplicateComponent(component.id)}
                            />
                        ))}

                        {components.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="mb-4 text-stone-500">No content yet</p>
                                <Button onClick={onShowAddMenu} variant="outline">
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
                                        : ''
                                } ${activeComponent.type === 'mixset' ? 'bg-[#00f0ff]/15 text-[#00f0ff]' : ''} ${
                                    activeComponent.type === 'link'
                                        ? 'bg-[#a855f7]/15 text-[#a855f7]'
                                        : ''
                                } `}
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
        </section>
    );
}
