'use client';

import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';

import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Calendar, Link2, Music, Palette, Plus, Search } from 'lucide-react';

import type { ContentEntry } from '@/types';

import { useEntries } from '../hooks/use-editor-data';
import { selectSetView, useDashboardStore } from '../stores/dashboardStore';

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

    const events = useMemo(() => entries.filter((e) => e.type === 'event'), [entries]);
    const mixsets = useMemo(() => entries.filter((e) => e.type === 'mixset'), [entries]);
    const links = useMemo(() => entries.filter((e) => e.type === 'link'), [entries]);
    const hasEntries = events.length > 0 || mixsets.length > 0 || links.length > 0;

    const handleSelectEntry = (entryId: string) => {
        setView({ kind: 'detail', entryId });
        setOpen(false);
    };

    const handleAction = (action: string) => {
        switch (action) {
            case 'create-event':
                setView({ kind: 'create', entryType: 'event' });
                break;
            case 'create-mixset':
                setView({ kind: 'create', entryType: 'mixset' });
                break;
            case 'create-link':
                setView({ kind: 'create', entryType: 'link' });
                break;
            case 'bio':
                setView({ kind: 'bio' });
                break;
        }
        setOpen(false);
    };

    const entryIcon = (type: ContentEntry['type']) => {
        switch (type) {
            case 'event':
                return <Calendar className="h-3.5 w-3.5 text-dashboard-text-placeholder" />;
            case 'mixset':
                return <Music className="h-3.5 w-3.5 text-dashboard-text-placeholder" />;
            case 'link':
                return <Link2 className="h-3.5 w-3.5 text-dashboard-text-placeholder" />;
        }
    };

    return (
        <>
            {/* Sidebar trigger */}
            <button
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashboard-border px-3 py-1.5 text-left text-sm text-dashboard-text-placeholder transition-colors hover:border-dashboard-border-hover hover:bg-dashboard-bg-hover"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1">Search...</span>
                <kbd className="rounded bg-dashboard-bg-active px-1.5 py-0.5 font-mono text-[10px] text-dashboard-text-muted">
                    ⌘K
                </kbd>
            </button>

            {/* Command palette dialog */}
            <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                label="Command palette"
                overlayClassName="fixed inset-0 z-50 bg-black/20"
                contentClassName="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
            >
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">
                    Search entries and run quick actions
                </DialogDescription>

                <div className="overflow-hidden rounded-xl border border-dashboard-border bg-white shadow-2xl">
                    <Command.Input
                        placeholder="Search entries..."
                        className="w-full border-b border-dashboard-border bg-transparent px-4 py-3 font-inter text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                    />
                    <Command.List className="max-h-80 overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-dashboard-text-placeholder">
                        <Command.Empty className="px-4 py-6 text-center text-sm text-dashboard-text-muted">
                            No results found.
                        </Command.Empty>

                        {events.length > 0 && (
                            <Command.Group heading="Events">
                                {events.map((entry) => (
                                    <Command.Item
                                        key={entry.id}
                                        value={`${entry.title} ${entry.id}`}
                                        onSelect={() => handleSelectEntry(entry.id)}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                                    >
                                        {entryIcon('event')}
                                        {entry.title || 'Untitled'}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {mixsets.length > 0 && (
                            <Command.Group heading="Mixsets">
                                {mixsets.map((entry) => (
                                    <Command.Item
                                        key={entry.id}
                                        value={`${entry.title} ${entry.id}`}
                                        onSelect={() => handleSelectEntry(entry.id)}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                                    >
                                        {entryIcon('mixset')}
                                        {entry.title || 'Untitled'}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {links.length > 0 && (
                            <Command.Group heading="Links">
                                {links.map((entry) => (
                                    <Command.Item
                                        key={entry.id}
                                        value={`${entry.title} ${entry.id}`}
                                        onSelect={() => handleSelectEntry(entry.id)}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                                    >
                                        {entryIcon('link')}
                                        {entry.title || 'Untitled'}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {hasEntries && (
                            <Command.Separator className="my-1.5 h-px bg-dashboard-border" />
                        )}

                        <Command.Group heading="Actions">
                            <Command.Item
                                value="Create new event"
                                onSelect={() => handleAction('create-event')}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                            >
                                <Plus className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                Create new event
                            </Command.Item>
                            <Command.Item
                                value="Create new mixset"
                                onSelect={() => handleAction('create-mixset')}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                            >
                                <Plus className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                Create new mixset
                            </Command.Item>
                            <Command.Item
                                value="Create new link"
                                onSelect={() => handleAction('create-link')}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                            >
                                <Plus className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                Create new link
                            </Command.Item>
                            <Command.Item
                                value="Edit bio and design"
                                onSelect={() => handleAction('bio')}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-inter text-sm text-dashboard-text-secondary data-[selected=true]:bg-dashboard-bg-active data-[selected=true]:text-dashboard-text"
                            >
                                <Palette className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                                Edit bio & design
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    {/* Footer */}
                    <div className="flex gap-4 border-t border-dashboard-border px-4 py-2 font-inter text-[11px] text-dashboard-text-placeholder">
                        <span>↑↓ Navigate</span>
                        <span>↵ Open</span>
                        <span>esc Close</span>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}
