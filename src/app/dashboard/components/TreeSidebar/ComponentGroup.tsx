'use client';

import type { ReactNode } from 'react';

import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

import {
    selectSetView,
    selectSidebarSections,
    selectToggleSection,
    useDashboardStore,
    type EntryType,
    type SectionKey,
} from '../../stores/dashboardStore';

interface ComponentGroupProps {
    section: SectionKey;
    title: string;
    icon?: ReactNode;
    count?: number;
    entryType?: EntryType; // Type used for the create panel
    children: ReactNode;
}

export default function ComponentGroup({
    section,
    title,
    icon,
    count,
    entryType,
    children,
}: ComponentGroupProps) {
    const sidebarSections = useDashboardStore(selectSidebarSections);
    const toggleSection = useDashboardStore(selectToggleSection);
    const setView = useDashboardStore(selectSetView);

    const isCollapsed = sidebarSections[section].collapsed;

    return (
        <div className="mb-1">
            {/* Section Header */}
            <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-dashboard-bg-hover/70"
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
                <span className="flex-1 text-sm text-dashboard-text-secondary">{title}</span>

                {/* Count Badge */}
                {count !== undefined && count > 0 && (
                    <span className="rounded-full bg-dashboard-bg-muted px-1.5 py-0.5 text-[10px] font-normal text-dashboard-text-placeholder">
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
                className="relative ml-2 grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
            >
                <div className="overflow-hidden">
                    {/* Tree Line - vertical line */}
                    <div className="absolute bottom-2 left-2 top-2 w-px bg-dashboard-border-hover" />
                    {children}
                </div>
            </div>
        </div>
    );
}
