'use client';

import { useEditorStore, type SectionKey } from '@/stores/editorStore';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
                className="group flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                onClick={() => toggleSection(section)}
            >
                {/* Collapse Arrow */}
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-white/40" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-white/40" />
                )}

                {/* Icon (optional) */}
                {icon && <span className="text-white/60">{icon}</span>}

                {/* Title */}
                <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                    {title}
                </span>

                {/* Count Badge */}
                {count !== undefined && count > 0 && (
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
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
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                    >
                        <Plus className="h-3.5 w-3.5 text-white/60" />
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
