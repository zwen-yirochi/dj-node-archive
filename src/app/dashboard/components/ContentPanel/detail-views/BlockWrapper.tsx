'use client';

import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { ReactNode } from 'react';

import { GripVertical, Trash2, type LucideIcon } from 'lucide-react';

interface BlockWrapperProps {
    /** 블록 라벨 */
    label: string;
    /** 블록 아이콘 */
    icon: LucideIcon;
    /** 삭제 핸들러 — 없으면 삭제 버튼 숨김 */
    onDelete?: () => void;
    /** 드래그 핸들 props (dnd-kit) — 없으면 드래그 핸들 숨김 */
    dragHandleProps?: {
        attributes: DraggableAttributes;
        listeners: SyntheticListenerMap | undefined;
    };
    /** 드래그 중 opacity 처리 */
    isDragging?: boolean;
    disabled?: boolean;
    children: ReactNode;
}

export default function BlockWrapper({
    label,
    icon: Icon,
    onDelete,
    dragHandleProps,
    isDragging,
    disabled,
    children,
}: BlockWrapperProps) {
    return (
        <div
            className={`group relative rounded-lg border border-transparent p-3 transition-colors hover:border-dashboard-border/50 hover:bg-dashboard-bg-muted/30 ${
                isDragging ? 'drag-source-ghost' : ''
            }`}
        >
            {/* Block Header */}
            <div className="mb-2 flex items-center gap-2">
                {dragHandleProps && (
                    <button
                        {...dragHandleProps.attributes}
                        {...(dragHandleProps.listeners as React.HTMLAttributes<HTMLButtonElement>)}
                        className="drag-handle-hover rounded p-0.5"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
                <Icon className="h-3.5 w-3.5 text-dashboard-text-muted" />
                <span className="text-xs font-medium text-dashboard-text-muted">{label}</span>
                <div className="flex-1" />
                {!disabled && onDelete && (
                    <button
                        onClick={onDelete}
                        className="rounded p-0.5 opacity-0 transition-opacity hover:bg-dashboard-bg-muted group-hover:opacity-100"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-dashboard-text-muted hover:text-dashboard-danger" />
                    </button>
                )}
            </div>

            {/* Block Content */}
            {children}
        </div>
    );
}
