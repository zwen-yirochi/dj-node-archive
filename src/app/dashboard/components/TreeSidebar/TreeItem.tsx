'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Calendar,
    Check,
    Eye,
    EyeOff,
    Headphones,
    Link as LinkIcon,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';

interface TreeItemProps {
    component: ComponentData;
    isInViewSection?: boolean;
    viewItemId?: string;
    isVisible?: boolean;
    isLast?: boolean;
    onToggleVisibility?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const typeConfig = {
    show: {
        icon: Calendar,
        color: 'text-neutral-500',
        bgColor: 'bg-neutral-200',
    },
    mixset: {
        icon: Headphones,
        color: 'text-neutral-500',
        bgColor: 'bg-neutral-200',
    },
    link: {
        icon: LinkIcon,
        color: 'text-neutral-500',
        bgColor: 'bg-neutral-200',
    },
};

export default function TreeItem({
    component,
    isInViewSection = false,
    viewItemId,
    isVisible = true,
    isLast = false,
    onToggleVisibility,
    onEdit,
    onDelete,
}: TreeItemProps) {
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const selectComponent = useEditorStore((state) => state.selectComponent);
    const setEditMode = useEditorStore((state) => state.setEditMode);
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

    const handleEdit = () => {
        selectComponent(component.id);
        setEditMode('edit');
        onEdit?.();
    };

    const handleDelete = () => {
        onDelete?.();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group relative flex cursor-pointer touch-none items-center rounded-md py-1.5 pr-2 transition-colors',
                isSelected
                    ? 'bg-neutral-200 text-neutral-900'
                    : 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-900',
                isDragging && 'opacity-50',
                !isVisible && 'opacity-50'
            )}
            onClick={handleClick}
        >
            {/* Tree Line */}
            <div className="relative flex h-full w-7 shrink-0 items-center">
                <div
                    className={cn(
                        'absolute left-3 w-px bg-neutral-300',
                        isLast ? '-top-1 h-[calc(50%+4px)]' : '-top-1 h-[calc(100%+4px)]'
                    )}
                />
                <div className="absolute left-3 h-px w-2.5 bg-neutral-300" />
            </div>

            {/* Type Icon - Page 섹션에서만 표시 */}
            {isInViewSection && (
                <div
                    className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded',
                        config.bgColor
                    )}
                >
                    <Icon className={cn('h-3 w-3', config.color)} />
                </div>
            )}

            {/* Title */}
            <span className={cn('min-w-0 flex-1 truncate text-sm', isInViewSection && 'ml-2')}>
                {component.title || '제목 없음'}
            </span>

            {/* Right Side Actions */}
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {isInViewSection ? (
                    <button
                        onClick={handleVisibilityClick}
                        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-neutral-300"
                    >
                        {isVisible ? (
                            <Eye className="h-3.5 w-3.5 text-neutral-500" />
                        ) : (
                            <EyeOff className="h-3.5 w-3.5 text-neutral-400" />
                        )}
                    </button>
                ) : (
                    <>
                        {isInView && (
                            <Check className="absolute h-3.5 w-3.5 text-green-600 transition-opacity group-hover:opacity-0" />
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-neutral-300 group-hover:opacity-100"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5 text-neutral-500" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-36 border-neutral-200 bg-white shadow-lg"
                            >
                                <DropdownMenuItem
                                    onClick={handleEdit}
                                    className="cursor-pointer text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900"
                                >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    편집
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-neutral-200" />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    삭제
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>

            {/* Page 섹션의 더보기 메뉴 */}
            {isInViewSection && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-all hover:bg-neutral-300 group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5 text-neutral-500" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-36 border-neutral-200 bg-white shadow-lg"
                    >
                        <DropdownMenuItem
                            onClick={handleEdit}
                            className="cursor-pointer text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900"
                        >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-200" />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Page에서 제거
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
