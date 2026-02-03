'use client';

import { cn } from '@/lib/utils';
import { type SectionKey, useUIStore } from '@/stores/uiStore';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionItemProps {
    section: SectionKey;
    title: string;
    icon?: ReactNode;
    count?: number;
    onAdd?: () => void;
    children: ReactNode;
}

export default function SectionItem({
    section,
    title,
    icon,
    count,
    onAdd,
    children,
}: SectionItemProps) {
    const sidebarSections = useUIStore((state) => state.sidebarSections);
    const toggleSection = useUIStore((state) => state.toggleSection);

    const isCollapsed = sidebarSections[section].collapsed;

    return (
        <div className="mb-1">
            {/* Section Header */}
            <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-dashboard-bg-hover"
                onClick={() => toggleSection(section)}
            >
                {/* Collapse Arrow */}
                <span className="flex h-4 w-4 items-center justify-center text-dashboard-text-placeholder">
                    {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </span>

                {/* Icon (optional) */}
                {icon && <span className="text-dashboard-text-muted">{icon}</span>}

                {/* Title */}
                <span className="flex-1 text-sm font-medium text-dashboard-text-secondary">
                    {title}
                </span>

                {/* Count Badge */}
                {count !== undefined && count > 0 && (
                    <span className="rounded bg-dashboard-bg-active px-1.5 py-0.5 text-[10px] font-medium text-dashboard-text-muted">
                        {count}
                    </span>
                )}

                {/* Add Button */}
                {onAdd && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-dashboard-bg-active group-hover:opacity-100"
                    >
                        <Plus className="h-3.5 w-3.5 text-dashboard-text-secondary" />
                    </button>
                )}
            </div>

            {/* Section Content */}
            <div
                className={cn(
                    'ml-2 overflow-hidden transition-all duration-200',
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
                )}
            >
                {children}
            </div>
        </div>
    );
}
