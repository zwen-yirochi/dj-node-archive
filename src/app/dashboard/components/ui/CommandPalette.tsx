'use client';

import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';

import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Palette, Plus, Search } from 'lucide-react';

import type { ContentEntry } from '@/types';
import { TypeBadge } from '@/components/dna';

import { ENTRY_TYPE_CONFIG, type EntryType } from '../../config/entryConfig';
import { COMPONENT_GROUPS } from '../../config/sidebarConfig';
import { useEntries } from '../../hooks/use-editor-data';
import { selectSetView, useDashboardStore } from '../../stores/dashboardStore';

/** Creatable entry types — custom auto-creates, so include all types */
const CREATABLE_TYPES = COMPONENT_GROUPS.map((g) => g.entryType);

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const { data: entries } = useEntries();
    const setView = useDashboardStore(selectSetView);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Group entries by type using COMPONENT_GROUPS config
    const entriesByType = useMemo(() => {
        const map = new Map<EntryType, ContentEntry[]>();
        for (const group of COMPONENT_GROUPS) {
            map.set(
                group.entryType,
                entries.filter((e) => e.type === group.entryType)
            );
        }
        return map;
    }, [entries]);

    const hasEntries = Array.from(entriesByType.values()).some((arr) => arr.length > 0);

    const handleSelectEntry = (entryId: string) => {
        setView({ kind: 'detail', entryId });
        setOpen(false);
    };

    const handleCreate = (type: EntryType) => {
        setView({ kind: 'create', entryType: type });
        setOpen(false);
    };

    return (
        <>
            {/* Sidebar trigger */}
            <button
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg bg-dashboard-bg-hover/60 px-3 py-1.5 text-left text-sm text-dashboard-text-placeholder transition-colors hover:bg-dashboard-bg-hover"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1">Search...</span>
                <kbd className="rounded bg-dashboard-bg-muted px-1.5 py-0.5 font-mono text-[10px] text-dashboard-text-placeholder">
                    ⌘K
                </kbd>
            </button>

            {/* Command palette dialog */}
            <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                label="Command palette"
                overlayClassName="fixed inset-0 z-50 bg-black/25"
                contentClassName="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
            >
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">
                    Search entries and run quick actions
                </DialogDescription>

                <div className="overflow-hidden rounded-2xl bg-white/80 shadow-xl backdrop-blur-xl">
                    <Command.Input
                        placeholder="Search entries..."
                        className="w-full border-b border-dashboard-border/50 bg-transparent px-4 py-3 font-inter text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                    />
                    <Command.List className="max-h-80 overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-dashboard-text-placeholder">
                        <Command.Empty className="px-4 py-6 text-center text-sm text-dashboard-text-muted">
                            No results found.
                        </Command.Empty>

                        {/* Entry search groups — driven by COMPONENT_GROUPS */}
                        {COMPONENT_GROUPS.map((group) => {
                            const groupEntries = entriesByType.get(group.entryType) ?? [];
                            if (groupEntries.length === 0) return null;

                            return (
                                <Command.Group key={group.entryType} heading={group.title}>
                                    {groupEntries.map((entry) => (
                                        <Command.Item
                                            key={entry.id}
                                            value={`${entry.title} ${entry.id}`}
                                            onSelect={() => handleSelectEntry(entry.id)}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                                        >
                                            <TypeBadge
                                                type={ENTRY_TYPE_CONFIG[group.entryType].badgeType}
                                                size="sm"
                                            />
                                            {entry.title || 'Untitled'}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            );
                        })}

                        {hasEntries && (
                            <Command.Separator className="my-1.5 h-px bg-dashboard-border" />
                        )}

                        {/* Actions — driven by CREATABLE_TYPES */}
                        <Command.Group heading="Actions">
                            {CREATABLE_TYPES.map((type) => {
                                const config = ENTRY_TYPE_CONFIG[type];
                                return (
                                    <Command.Item
                                        key={type}
                                        value={`Create new ${config.label}`}
                                        onSelect={() => handleCreate(type)}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                                    >
                                        <Plus className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                        Create new {config.label.toLowerCase()}
                                    </Command.Item>
                                );
                            })}
                            <Command.Item
                                value="Edit bio and design"
                                onSelect={() => {
                                    setView({ kind: 'bio' });
                                    setOpen(false);
                                }}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                            >
                                <Palette className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                Edit bio & design
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    {/* Footer */}
                    <div className="flex gap-4 border-t border-dashboard-border/50 px-4 py-2 font-inter text-[11px] text-dashboard-text-placeholder">
                        <span>↑↓ Navigate</span>
                        <span>↵ Open</span>
                        <span>esc Close</span>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}
