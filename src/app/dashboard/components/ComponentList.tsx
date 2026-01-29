import { Button } from '@/components/ui/button';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface ComponentListProps {
    components: any;
    selectedComponentId: any;
    onSelectComponent: any;
    onDeleteComponent: any;
    onDuplicateComponent: any;
    onShowAddMenu: any;
    dragHandlers: any;
    sensors: any;
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
            ></DndContext>
        </section>
    );
}
