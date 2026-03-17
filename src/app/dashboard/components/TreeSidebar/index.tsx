// app/dashboard/components/TreeSidebar/index.tsx
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import Link from 'next/link';

import { FileText, Palette } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { cn } from '@/lib/utils';
import { COMPONENT_GROUPS } from '@/app/dashboard/config/ui/sidebar';
import { useDndBridgeStore } from '@/app/dashboard/stores/dndBridgeStore';
import { TypeBadge } from '@/components/dna';

import { useEntries, usePageMeta, useUser } from '../../hooks';
import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import { CommandPalette } from '../ui/CommandPalette';
import AccountSection from './AccountSection';
import ComponentGroup from './ComponentGroup';
import TreeItem from './TreeItem';

export default function TreeSidebar() {
    // TanStack Query
    const { data: entries } = useEntries();
    const { data: pageMeta } = usePageMeta();
    const user = useUser();

    // Section membership — computed once, passed as prop
    const sectionEntryIds = useMemo(() => {
        const ids = new Set<string>();
        for (const s of pageMeta?.sections ?? []) {
            for (const id of s.entryIds) ids.add(id);
        }
        return ids;
    }, [pageMeta?.sections]);

    // Dashboard Store
    const contentView = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    // Derive sidebar highlight state from contentView
    const isBioActive = contentView.kind === 'bio';
    const isPageActive = contentView.kind === 'page';

    // DND bridge — 드롭 순간 동기적 순서 보정
    const tempEntryOrder = useDndBridgeStore((s) => s.tempEntryOrder);

    // Filter & sort by type (bridge가 있으면 bridge 순서 우선)
    const entriesByType = useMemo(() => {
        const map: Record<string, ContentEntry[]> = {};
        for (const cfg of COMPONENT_GROUPS) {
            const typed = entries.filter((e) => e.type === cfg.entryType);
            if (tempEntryOrder) {
                const orderMap = new Map(tempEntryOrder.map((id, i) => [id, i]));
                typed.sort((a, b) => {
                    const aIdx = orderMap.get(a.id) ?? a.position;
                    const bIdx = orderMap.get(b.id) ?? b.position;
                    return aIdx - bIdx;
                });
            } else {
                typed.sort((a, b) => a.position - b.position);
            }
            map[cfg.entryType] = typed;
        }
        return map;
    }, [entries, tempEntryOrder]);

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
                <button
                    onClick={() => setView({ kind: 'page' })}
                    className={cn(
                        'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                        isPageActive
                            ? 'bg-dashboard-bg-active/70 font-medium text-dashboard-text'
                            : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover/70'
                    )}
                >
                    <FileText className="h-4 w-4 text-dashboard-text-muted" />
                    <span className="flex-1 text-sm">Page</span>
                </button>

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
                                            <TreeItem
                                                key={entry.id}
                                                entry={entry}
                                                isInSection={sectionEntryIds.has(entry.id)}
                                            />
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
