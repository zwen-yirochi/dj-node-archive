'use client';

import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import { cn } from '@/lib/utils';
import {
    canAddToView,
    getMissingFieldLabels,
    getTreeItemStatus,
    type TreeItemStatus,
} from '@/app/dashboard/config/entryFieldConfig';
import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import type { ContentEntry } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Check, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface TreeItemProps {
    entry: ContentEntry;
    isInViewSection?: boolean;
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
    entry,
    isInViewSection = false,
    isVisible = true,
    onToggleVisibility,
    onEdit,
    onDelete,
}: TreeItemProps) {
    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // 상태 계산 - displayOrder가 숫자이면 Page에 있음
    const isInView = typeof entry.displayOrder === 'number';
    const isValid = canAddToView(entry);
    const status = getTreeItemStatus(isInView, isValid);
    const missingFields = status === 'warning' ? getMissingFieldLabels(entry, 'view') : [];

    const isSelected = contentView.kind === 'detail' && contentView.entryId === entry.id;
    const config = ENTRY_TYPE_CONFIG[entry.type];

    // ViewSection에서는 'view-{id}' 형식의 ID 사용 (SortableContext와 일치)
    const sortableId = isInViewSection ? `view-${entry.id}` : entry.id;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: sortableId,
        data: {
            type: isInViewSection ? 'display-entry' : 'entry',
            entry,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        setView({ kind: 'detail', entryId: entry.id });
    };

    const handleVisibilityClick = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onToggleVisibility?.();
    };

    const handleEdit = () => {
        setView({ kind: 'detail', entryId: entry.id });
        onEdit?.();
    };

    const handleDelete = () => {
        onDelete?.();
    };

    // 엔트리 섹션용 메뉴 아이템
    const entryMenuItems: DropdownMenuItemConfig[] = [
        { label: '편집', onClick: handleEdit, icon: Pencil },
        { type: 'separator' },
        { label: '삭제', onClick: handleDelete, icon: Trash2, variant: 'danger' },
    ];

    // Page 섹션용 메뉴 아이템
    const viewMenuItems: DropdownMenuItemConfig[] = [
        { label: '편집', onClick: handleEdit, icon: Pencil },
        {
            label: isVisible ? '숨김' : '표시',
            onClick: () => handleVisibilityClick(),
            icon: isVisible ? Eye : EyeOff,
        },
        { type: 'separator' },
        { label: 'Page에서 제거', onClick: handleDelete, icon: Trash2, variant: 'danger' },
    ];

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
            {/* Type Badge - Page 섹션에서만 표시 */}
            {isInViewSection && <TypeBadge type={config.badgeType} />}

            {/* Title */}
            <span className={cn('ml-2 min-w-0 flex-1 truncate text-sm', isInViewSection && 'ml-2')}>
                {entry.title || '제목 없음'}
            </span>

            {/* Right Side - View Section: Menu */}
            {isInViewSection ? (
                <SimpleDropdown
                    trigger={
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        </button>
                    }
                    items={viewMenuItems}
                    contentClassName="w-36"
                />
            ) : (
                /* Right Side - Entry Section: Status Icon + Menu (같은 위치) */
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    {/* 상태 아이콘 - hover 시 숨김 */}
                    <div className="absolute transition-opacity group-hover:opacity-0">
                        <StatusIcon status={status} missingFields={missingFields} />
                    </div>
                    {/* 더보기 메뉴 - hover 시 표시 */}
                    <SimpleDropdown
                        trigger={
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="absolute flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-dashboard-bg-active group-hover:opacity-100"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            </button>
                        }
                        items={entryMenuItems}
                        contentClassName="w-36"
                    />
                </div>
            )}
        </div>
    );
}
