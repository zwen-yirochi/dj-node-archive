'use client';

import { cn } from '@/lib/utils';
import {
    type EntryType,
    type SectionKey,
    selectSetView,
    selectSidebarSections,
    selectToggleSection,
    useDashboardStore,
} from '../../stores/dashboardStore';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionItemProps {
    section: SectionKey;
    title: string;
    icon?: ReactNode;
    count?: number;
    entryType?: EntryType; // 생성 패널에서 사용할 타입
    children: ReactNode;
}

export default function SectionItem({
    section,
    title,
    icon,
    count,
    entryType,
    children,
}: SectionItemProps) {
    const sidebarSections = useDashboardStore(selectSidebarSections);
    const toggleSection = useDashboardStore(selectToggleSection);
    const setView = useDashboardStore(selectSetView);

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
                {entryType && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setView({ kind: 'create', entryType });
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
                    'relative ml-2 overflow-hidden transition-all duration-200',
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
                )}
            >
                {/* Tree Line - 세로선 */}
                <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                {children}
            </div>
        </div>
    );
}
