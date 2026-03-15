// app/dashboard/components/TreeSidebar/index.tsx
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import Link from 'next/link';

import { ChevronDown, ChevronRight, FileText, Palette } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { COMPONENT_GROUPS } from '@/app/dashboard/config/ui/sidebar';
import { TypeBadge } from '@/components/dna';

import { useEntries, useUser } from '../../hooks';
import {
    selectContentView,
    selectSetView,
    selectSidebarSections,
    selectToggleSection,
    useDashboardStore,
} from '../../stores/dashboardStore';
import { CommandPalette } from '../ui/CommandPalette';
import AccountSection from './AccountSection';
import ComponentGroup from './ComponentGroup';
import TreeItem from './TreeItem';

export default function TreeSidebar() {
    // TanStack Query
    const { data: entries } = useEntries();
    const user = useUser();

    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);
    const sidebarSections = useDashboardStore(selectSidebarSections);
    const toggleSection = useDashboardStore(selectToggleSection);

    // Derive sidebar highlight state from contentView
    const isBioActive = contentView.kind === 'bio';
    const isPageActive = contentView.kind === 'page';

    // Filter & sort by type
    const entriesByType = useMemo(() => {
        const map: Record<string, ContentEntry[]> = {};
        for (const cfg of COMPONENT_GROUPS) {
            map[cfg.entryType] = entries
                .filter((e) => e.type === cfg.entryType)
                .sort((a, b) => a.position - b.position);
        }
        return map;
    }, [entries]);

    const isPageCollapsed = sidebarSections?.page?.collapsed ?? false;

    const handlePageClick = () => {
        setView({ kind: 'page' });
    };

    const handlePageToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleSection('page');
    };

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col bg-dashboard-bg-muted">
            {/* Header */}
            <div className="px-4 py-4">
                <Link href="/" className="font-display text-xl font-semibold text-dashboard-text">
                    DNA
                </Link>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
                <CommandPalette />
            </div>

            {/* Tree Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
                {/* Bio Design */}
                <button
                    onClick={() => setView({ kind: 'bio' })}
                    className={cn(
                        'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                        isBioActive
                            ? 'bg-dashboard-bg-active/70 font-medium text-dashboard-text'
                            : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover/70'
                    )}
                >
                    <Palette className="h-4 w-4 text-dashboard-text-muted" />
                    <span className="flex-1 text-sm">Bio design</span>
                </button>

                {/* Page */}
                <div
                    onClick={handlePageClick}
                    className={cn(
                        'group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                        isPageActive
                            ? 'bg-dashboard-bg-active/70 font-medium text-dashboard-text'
                            : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover/70'
                    )}
                >
                    <FileText className="h-4 w-4 text-dashboard-text-muted" />
                    <span className="flex-1 text-sm">Page</span>
                    <button
                        onClick={handlePageToggle}
                        className="flex h-4 w-4 items-center justify-center text-dashboard-text-placeholder hover:text-dashboard-text-muted"
                    >
                        {isPageCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="my-2" />

                {/* Components */}
                <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-dashboard-text-placeholder">
                    Components
                </p>

                {/* Entry Sections */}
                {COMPONENT_GROUPS.map((cfg) => {
                    const items = entriesByType[cfg.entryType] ?? [];
                    return (
                        <ComponentGroup
                            key={cfg.section}
                            section={cfg.section}
                            title={cfg.title}
                            icon={<TypeBadge type={cfg.badgeType} size="sm" />}
                            count={items.length}
                            entryType={cfg.entryType}
                        >
                            <SortableContext
                                items={items.map((e) => e.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="py-0.5">
                                    {items.length === 0 ? (
                                        <SectionEmptyHint label={cfg.emptyLabel} />
                                    ) : (
                                        items.map((entry) => (
                                            <TreeItem key={entry.id} entry={entry} />
                                        ))
                                    )}
                                </div>
                            </SortableContext>
                        </ComponentGroup>
                    );
                })}
            </div>

            {/* Account Section */}
            <AccountSection username={user.username} />
        </aside>
    );
}

function SectionEmptyHint({ label }: { label: string }) {
    return (
        <p className="py-2 pl-6 text-xs text-dashboard-text-placeholder">Use + to add {label}</p>
    );
}
