'use client';

import { useState } from 'react';

import { Search } from 'lucide-react';

import type { ContentEntry } from '@/types/domain';
import { DashboardDialogContent, Dialog } from '@/app/dashboard/components/ui/DashboardDialog';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';
import { DialogTitle } from '@/components/ui/dialog';

interface AddEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entries: ContentEntry[];
    onSelect: (entryId: string) => void;
}

export function AddEntryModal({ open, onOpenChange, entries, onSelect }: AddEntryModalProps) {
    const [search, setSearch] = useState('');

    const filtered = search
        ? entries.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
        : entries;

    const handleSelect = (entryId: string) => {
        onSelect(entryId);
        onOpenChange(false);
        setSearch('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DashboardDialogContent size="sm">
                <DialogTitle className="text-sm font-medium text-dashboard-text">
                    Add entry to section
                </DialogTitle>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-md border border-dashboard-border px-2 py-1.5">
                    <Search className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search entries..."
                        className="flex-1 bg-transparent text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                        autoFocus
                    />
                </div>

                {/* Entry list */}
                <div className="max-h-64 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="py-4 text-center text-xs text-dashboard-text-placeholder">
                            {search ? 'No matching entries' : 'No available entries'}
                        </p>
                    ) : (
                        <div className="space-y-0.5">
                            {filtered.map((entry) => {
                                const config = ENTRY_TYPE_CONFIG[entry.type];
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => handleSelect(entry.id)}
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                                    >
                                        <TypeBadge type={config.badgeType} size="sm" />
                                        <span className="flex-1 truncate">
                                            {entry.title || 'Untitled'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}
