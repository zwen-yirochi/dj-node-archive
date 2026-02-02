'use client';

import { cn } from '@/lib/utils';
import { useEditorStore, type SectionKey } from '@/stores/editorStore';
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
    const sidebarSections = useEditorStore((state) => state.sidebarSections);
    const toggleSection = useEditorStore((state) => state.toggleSection);

    const isCollapsed = sidebarSections[section].collapsed;

    return (
        <div className="mb-1">
            {/* Section Header */}
            <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-200/50"
                onClick={() => toggleSection(section)}
            >
                {/* Collapse Arrow */}
                <span className="flex h-4 w-4 items-center justify-center text-neutral-400">
                    {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </span>

                {/* Icon (optional) */}
                {icon && <span className="text-neutral-500">{icon}</span>}

                {/* Title */}
                <span className="flex-1 text-sm font-medium text-neutral-700">{title}</span>

                {/* Count Badge */}
                {count !== undefined && count > 0 && (
                    <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
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
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-neutral-300 group-hover:opacity-100"
                    >
                        <Plus className="h-3.5 w-3.5 text-neutral-600" />
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
