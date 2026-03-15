import { useState } from 'react';

import { GripVertical, Trash2 } from 'lucide-react';

import type { ViewType } from '@/types/domain';

const VIEW_TYPE_OPTIONS: { value: ViewType; label: string }[] = [
    { value: 'list', label: 'List' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'grid', label: 'Grid' },
    { value: 'feature', label: 'Feature' },
];

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
            <select
                value={viewType}
                onChange={(e) => onViewTypeChange(e.target.value as ViewType)}
                className="rounded border border-dashboard-border bg-dashboard-bg px-2 py-1 text-xs text-dashboard-text"
            >
                {VIEW_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-red-400"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
