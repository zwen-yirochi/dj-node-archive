import { useState } from 'react';

import { Eye, EyeOff, GripVertical, Loader2, Trash2 } from 'lucide-react';

import type { ViewType } from '@/types/domain';
import { cn } from '@/lib/utils';
import { CONVERTIBLE_VIEW_TYPES, FEATURE_VIEW_TYPE } from '@/app/dashboard/config/ui/view-types';

interface Props {
    title: string | null;
    viewType: ViewType;
    isVisible: boolean;
    dragHandleProps: Record<string, unknown>;
    onTitleChange: (title: string | null) => void;
    onViewTypeChange: (viewType: ViewType) => void;
    onToggleVisibility: () => void;
    onDelete: () => void;
}

export function SectionHeader({
    title,
    viewType,
    isVisible,
    dragHandleProps,
    onTitleChange,
    onViewTypeChange,
    onToggleVisibility,
    onDelete,
}: Props) {
    const [localTitle, setLocalTitle] = useState(title ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const handleBlur = () => {
        const trimmed = localTitle.trim() || null;
        if (trimmed !== title) {
            onTitleChange(trimmed);
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 600);
        }
    };

    const isFeature = viewType === 'feature';
    const FeatureIcon = FEATURE_VIEW_TYPE.icon;

    return (
        <div className="flex items-center gap-2 px-2 py-2">
            <button {...dragHandleProps} className="drag-handle">
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center gap-1.5">
                <input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    placeholder="Section title (optional)"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
                />
                {isSaving && (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin text-dashboard-text-muted" />
                )}
            </div>
            {isFeature ? (
                <div className="flex items-center gap-1 rounded-md border border-dashboard-border px-2 py-1 text-dashboard-text-placeholder">
                    <FeatureIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Feature</span>
                </div>
            ) : (
                <div className="flex items-center gap-0.5 rounded-md border border-dashboard-border p-0.5">
                    {CONVERTIBLE_VIEW_TYPES.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = viewType === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => onViewTypeChange(opt.value)}
                                title={opt.label}
                                className={cn(
                                    'flex items-center gap-1 rounded px-1.5 py-1 transition-colors',
                                    isActive
                                        ? 'bg-dashboard-bg-active text-dashboard-text'
                                        : 'text-dashboard-text-placeholder hover:text-dashboard-text-secondary'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-[10px]">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
            <button
                onClick={onToggleVisibility}
                className="text-dashboard-text-placeholder hover:text-dashboard-text"
                title={isVisible ? 'Hide section' : 'Show section'}
            >
                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <div className="h-3.5 w-px bg-dashboard-border" />
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-dashboard-danger"
                title="Delete section"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
