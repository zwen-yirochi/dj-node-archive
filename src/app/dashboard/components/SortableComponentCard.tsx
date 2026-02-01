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
            className={`group relative rounded-xl border backdrop-blur-sm transition-all ${
                isSelected
                    ? 'border-white/30 bg-black/60 ring-1 ring-white/20'
                    : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/50'
            } ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none text-white/40 transition-colors hover:text-white/70 active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={onSelect}>
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                        <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getTypeColor()}`}
                        >
                            {component.type}
                        </span>
                    </div>

                    <h3 className="mb-0.5 truncate text-sm font-medium text-white/90">
                        {getTitle()}
                    </h3>

                    {/* 추가 정보 */}
                    {component.type === 'show' && (
                        <p className="text-xs text-white/50">
                            {(component as EventComponent).venue} •{' '}
                            {(component as EventComponent).date}
                        </p>
                    )}
                    {component.type === 'mixset' && (
                        <p className="text-xs text-white/50">
                            {(component as MixsetComponent).genre} •{' '}
                            {(component as MixsetComponent).releaseDate}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/50 hover:bg-red-500/20 hover:text-red-400"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
