'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { COMPONENT_TYPE_CONFIG } from '@/constants/componentConfig';
import { cn } from '@/lib/utils';
import { canAddToView, getMissingFieldLabels } from '@/lib/validators';
import { useUIStore } from '@/stores/uiStore';
import { useViewStore } from '@/stores/viewStore';
import type { ComponentData } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Check, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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
    // UI Store
    const selectedComponentId = useUIStore((state) => state.selectedComponentId);
    const selectComponent = useUIStore((state) => state.selectComponent);
    const setEditMode = useUIStore((state) => state.setEditMode);

    // View Store
    const viewItems = useViewStore((state) => state.viewItems);

    // viewItems에서 현재 컴포넌트가 포함되어 있는지 확인
    const isInView = viewItems.some((item) => item.componentId === component.id);

    // 컴포넌트 유효성 검사
    const isValid = canAddToView(component);
    const missingFields = !isValid ? getMissingFieldLabels(component, 'view') : [];

    const isSelected = selectedComponentId === component.id;
    const config = COMPONENT_TYPE_CONFIG[component.type];
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
                    ? 'bg-dashboard-bg-active text-dashboard-text'
                    : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text',
                isDragging && 'opacity-50',
                !isVisible && 'opacity-50'
            )}
            onClick={handleClick}
        >
            {/* Tree Line */}
            <div className="relative flex h-full w-7 shrink-0 items-center">
                <div
                    className={cn(
                        'absolute left-3 w-px bg-dashboard-border-hover',
                        isLast ? '-top-1 h-[calc(50%+4px)]' : '-top-1 h-[calc(100%+4px)]'
                    )}
                />
                <div className="absolute left-3 h-px w-2.5 bg-dashboard-border-hover" />
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

            {/* 유효하지 않은 컴포넌트 표시 (View 섹션이 아닐 때만) */}
            {!isInViewSection && !isValid && (
                <span title={`Page에 추가하려면 필요: ${missingFields.join(', ')}`}>
                    <AlertCircle className="mr-1 h-3.5 w-3.5 shrink-0 text-amber-500" />
                </span>
            )}

            {/* Right Side Actions */}
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {isInViewSection ? (
                    <button
                        onClick={handleVisibilityClick}
                        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-dashboard-bg-active"
                    >
                        {isVisible ? (
                            <Eye className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        ) : (
                            <EyeOff className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                        )}
                    </button>
                ) : (
                    <>
                        {isInView && (
                            <Check className="absolute h-3.5 w-3.5 text-dashboard-type-link transition-opacity group-hover:opacity-0" />
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-36 border-dashboard-border bg-dashboard-bg-card shadow-lg"
                            >
                                <DropdownMenuItem
                                    onClick={handleEdit}
                                    className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                                >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    편집
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-dashboard-border" />
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
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-36 border-dashboard-border bg-dashboard-bg-card shadow-lg"
                    >
                        <DropdownMenuItem
                            onClick={handleEdit}
                            className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                        >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-dashboard-border" />
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
