'use client';

import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Calendar,
    Check,
    Eye,
    EyeOff,
    GripVertical,
    Headphones,
    Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeItemProps {
    component: ComponentData;
    isInViewSection?: boolean;
    viewItemId?: string;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}

const typeConfig = {
    show: {
        icon: Calendar,
        color: 'text-[#ff2d92]',
        bgColor: 'bg-[#ff2d92]/10',
    },
    mixset: {
        icon: Headphones,
        color: 'text-[#00f0ff]',
        bgColor: 'bg-[#00f0ff]/10',
    },
    link: {
        icon: LinkIcon,
        color: 'text-[#a855f7]',
        bgColor: 'bg-[#a855f7]/10',
    },
};

export default function TreeItem({
    component,
    isInViewSection = false,
    viewItemId,
    isVisible = true,
    onToggleVisibility,
}: TreeItemProps) {
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const selectComponent = useEditorStore((state) => state.selectComponent);
    const viewItems = useEditorStore((state) => state.viewItems);

    // viewItems에서 현재 컴포넌트가 포함되어 있는지 확인
    const isInView = viewItems.some((item) => item.componentId === component.id);

    const isSelected = selectedComponentId === component.id;
    const config = typeConfig[component.type];
    const Icon = config.icon;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: isInViewSection ? viewItemId! : component.id,
        data: {
            type: isInViewSection ? 'view-item' : 'component',
            component,
            viewItemId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        selectComponent(component.id);
    };

    const handleVisibilityClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleVisibility?.();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group flex cursor-grab touch-none items-center gap-2 rounded-lg px-2 py-1.5 transition-colors active:cursor-grabbing',
                isSelected
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white/90',
                isDragging && 'opacity-50',
                !isVisible && 'opacity-50'
            )}
            onClick={handleClick}
        >
            {/* Drag Indicator */}
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-3.5 w-3.5 text-white/40" />
            </div>

            {/* Type Icon */}
            <div className={cn('flex h-5 w-5 items-center justify-center rounded', config.bgColor)}>
                <Icon className={cn('h-3 w-3', config.color)} />
            </div>

            {/* Title */}
            <span className="flex-1 truncate text-sm">{component.title || '제목 없음'}</span>

            {/* Status Indicator */}
            {isInViewSection ? (
                // View 섹션: 공개/비공개 토글
                <button
                    onClick={handleVisibilityClick}
                    className="rounded p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                >
                    {isVisible ? (
                        <Eye className="h-3.5 w-3.5 text-white/60" />
                    ) : (
                        <EyeOff className="h-3.5 w-3.5 text-white/40" />
                    )}
                </button>
            ) : (
                // 원본 섹션: View에 포함됨 표시
                isInView && <Check className="h-3.5 w-3.5 text-green-400/70" />
            )}
        </div>
    );
}
