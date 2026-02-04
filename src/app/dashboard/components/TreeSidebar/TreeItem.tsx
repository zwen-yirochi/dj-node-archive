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
import { canAddToView, getMissingFieldLabels, getTreeItemStatus } from '@/lib/validators';
import { useUIStore } from '@/stores/uiStore';
import { useViewStore } from '@/stores/viewStore';
import type { ComponentData } from '@/types';
import type { TreeItemStatus } from '@/types/componentFields';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Check, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface TreeItemProps {
    component: ComponentData;
    isInViewSection?: boolean;
    viewItemId?: string;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/** 상태별 아이콘 컴포넌트 */
function StatusIcon({
    status,
    missingFields,
}: {
    status: TreeItemStatus;
    missingFields: string[];
}) {
    switch (status) {
        case 'inView':
            return <Check className="h-3.5 w-3.5 text-dashboard-type-link" />;
        case 'warning':
            return (
                <span title={`Page에 추가하려면 필요: ${missingFields.join(', ')}`}>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                </span>
            );
        default:
            return null;
    }
}

export default function TreeItem({
    component,
    isInViewSection = false,
    viewItemId,
    isVisible = true,
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

    // 상태 계산
    const isInView = viewItems.some((item) => item.componentId === component.id);
    const isValid = canAddToView(component);
    const status = getTreeItemStatus(isInView, isValid);
    const missingFields = status === 'warning' ? getMissingFieldLabels(component, 'view') : [];

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
                'group relative flex cursor-pointer touch-none items-center rounded-md py-1.5 pl-5 pr-2 transition-colors',
                isSelected
                    ? 'bg-dashboard-bg-active text-dashboard-text'
                    : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text',
                isDragging && 'opacity-50',
                !isVisible && 'opacity-50'
            )}
            onClick={handleClick}
        >
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
            <span className={cn('ml-2 min-w-0 flex-1 truncate text-sm', isInViewSection && 'ml-2')}>
                {component.title || '제목 없음'}
            </span>

            {/* Right Side - View Section: Visibility + Menu */}
            {isInViewSection ? (
                <>
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

                            <DropdownMenuItem
                                onClick={handleVisibilityClick}
                                className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                            >
                                {isVisible ? (
                                    <>
                                        <Eye className="h-3.5 w-3.5 text-dashboard-text-muted" />
                                        숨김
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                        표시
                                    </>
                                )}
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
                </>
            ) : (
                /* Right Side - Component Section: Status Icon + Menu (같은 위치) */
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    {/* 상태 아이콘 - hover 시 숨김 */}
                    <div className="absolute transition-opacity group-hover:opacity-0">
                        <StatusIcon status={status} missingFields={missingFields} />
                    </div>
                    {/* 더보기 메뉴 - hover 시 표시 */}
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
                </div>
            )}
        </div>
    );
}
