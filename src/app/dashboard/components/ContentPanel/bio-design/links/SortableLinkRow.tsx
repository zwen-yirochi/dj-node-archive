'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent } from 'react';

import { GripVertical, X } from 'lucide-react';

import { sortableAnimateLayoutChanges } from '@/lib/dnd/animate';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

import type { LinkItem } from './links.utils';
import { getPlatformIcon, getPlatformLabel, getPlatformPlaceholder } from './profile-links.config';

interface SortableLinkRowProps {
    item: LinkItem;
    onToggle: (id: string) => void;
    onUrlChange: (id: string, url: string) => void;
    onLabelChange: (id: string, label: string) => void;
    onRemove?: (id: string) => void;
    onCommit: () => void;
}

export function SortableLinkRow({
    item,
    onToggle,
    onUrlChange,
    onLabelChange,
    onRemove,
    onCommit,
}: SortableLinkRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        animateLayoutChanges: sortableAnimateLayoutChanges,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = item.isPreset ? item.enabled : true;
    const isCustom = item.type === 'custom';
    const Icon = getPlatformIcon(item.type);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            onCommit();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 border-b border-dashboard-border/30 px-3 py-2.5 last:border-b-0',
                isDragging && 'drag-source-elevated'
            )}
        >
            {/* Drag handle */}
            <button type="button" className="drag-handle shrink-0" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4" />
            </button>

            {/* Platform icon + label */}
            <Icon
                className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-dashboard-text' : 'text-dashboard-text-muted'
                )}
            />
            <span
                className={cn(
                    'w-20 shrink-0 text-xs font-medium',
                    isActive ? 'text-dashboard-text' : 'text-dashboard-text-muted'
                )}
            >
                {isCustom ? item.label || 'Custom' : getPlatformLabel(item.type)}
            </span>

            {/* URL input — always rendered to prevent layout shift */}
            <Input
                value={item.url}
                onChange={(e) => onUrlChange(item.id, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlatformPlaceholder(item.type)}
                className={cn(
                    'h-7 flex-1 border-0 bg-transparent px-2 text-xs shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-0',
                    isActive ? 'text-dashboard-text' : 'text-dashboard-text-muted'
                )}
            />

            {/* Custom label input */}
            {isCustom && (
                <Input
                    value={item.label || ''}
                    onChange={(e) => onLabelChange(item.id, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Label"
                    className="h-7 w-20 border-0 bg-transparent px-2 text-xs text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
                />
            )}

            {/* Remove button (custom only) */}
            {isCustom && onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 rounded p-0.5 text-dashboard-text-muted hover:text-dashboard-text"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Toggle (preset only) — right end */}
            {item.isPreset && (
                <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label={`Toggle ${getPlatformLabel(item.type)}`}
                    onClick={() => onToggle(item.id)}
                    className={cn(
                        'h-4 w-7 shrink-0 rounded-full transition-colors',
                        isActive ? 'bg-dashboard-text' : 'bg-dashboard-border'
                    )}
                >
                    <span
                        className={cn(
                            'block h-3 w-3 rounded-full bg-dashboard-bg-surface transition-transform',
                            isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                        )}
                    />
                </button>
            )}
        </div>
    );
}
