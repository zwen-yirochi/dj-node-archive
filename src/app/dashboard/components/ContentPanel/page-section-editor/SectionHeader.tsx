import { useState } from 'react';

import { GripVertical, Trash2 } from 'lucide-react';

import type { ViewType } from '@/types/domain';
import { cn } from '@/lib/utils';
import { VIEW_TYPE_OPTIONS } from '@/app/dashboard/config/ui/view-types';

interface Props {
    title: string | null;
    viewType: ViewType;
    dragHandleProps: Record<string, unknown>;
    onTitleChange: (title: string | null) => void;
    onViewTypeChange: (viewType: ViewType) => void;
    onDelete: () => void;
}

export function SectionHeader({
    title,
    viewType,
    dragHandleProps,
    onTitleChange,
    onViewTypeChange,
    onDelete,
}: Props) {
    const [localTitle, setLocalTitle] = useState(title ?? '');

    const handleBlur = () => {
        onTitleChange(localTitle.trim() || null);
    };

    return (
        <div className="flex items-center gap-2 px-2 py-2">
            <button {...dragHandleProps} className="cursor-grab text-dashboard-text-placeholder">
                <GripVertical className="h-4 w-4" />
            </button>
            <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="섹션 제목 (선택)"
                className="flex-1 bg-transparent text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
            />
            {/* View type icon selector */}
            <div className="flex items-center gap-0.5 rounded-md border border-dashboard-border p-0.5">
                {VIEW_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = viewType === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onViewTypeChange(opt.value)}
                            title={opt.label}
                            className={cn(
                                'rounded p-1 transition-colors',
                                isActive
                                    ? 'bg-dashboard-bg-active text-dashboard-text'
                                    : 'text-dashboard-text-placeholder hover:text-dashboard-text-secondary'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </button>
                    );
                })}
            </div>
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-red-400"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
