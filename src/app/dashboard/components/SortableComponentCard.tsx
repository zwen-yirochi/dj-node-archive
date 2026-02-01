'use client';

import { Button } from '@/components/ui/button';
import { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

interface SortableComponentCardProps {
    component: ComponentData;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

export default function SortableComponentCard({
    component,
    isSelected,
    onSelect,
    onDelete,
}: SortableComponentCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: component.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getTitle = () => {
        if (component.type === 'show') return (component as EventComponent).title;
        if (component.type === 'mixset') return (component as MixsetComponent).title;
        if (component.type === 'link') return (component as LinkComponent).title;
        return '제목 없음';
    };

    const getTypeColor = () => {
        switch (component.type) {
            case 'show':
                return 'bg-[#ff2d92]/15 text-[#ff2d92] border-[#ff2d92]/20';
            case 'mixset':
                return 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/20';
            case 'link':
                return 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/20';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-xl border bg-white transition-all ${isSelected ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-300'} ${isDragging ? 'opacity-50 shadow-2xl' : 'hover:border-stone-400'} `}
        >
            <div className="flex items-start gap-4 p-6">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none text-stone-400 transition-colors hover:text-stone-600 active:cursor-grabbing"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1" onClick={onSelect}>
                    <div className="mb-2 flex items-start justify-between gap-4">
                        <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()} `}
                        >
                            {component.type}
                        </span>
                    </div>

                    <h3 className="mb-1 truncate text-lg font-semibold text-stone-900">
                        {getTitle()}
                    </h3>

                    {/* 추가 정보 */}
                    {component.type === 'show' && (
                        <p className="text-sm text-stone-500">
                            {(component as EventComponent).venue} •{' '}
                            {(component as EventComponent).date}
                        </p>
                    )}
                    {component.type === 'mixset' && (
                        <p className="text-sm text-stone-500">
                            {(component as MixsetComponent).genre} •{' '}
                            {(component as MixsetComponent).releaseDate}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
