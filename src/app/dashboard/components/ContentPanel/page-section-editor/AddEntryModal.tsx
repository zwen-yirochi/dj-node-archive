'use client';

import { useCallback, useState } from 'react';

import { Check, Search } from 'lucide-react';

import type { ContentEntry } from '@/types/domain';
import { DashboardDialogContent, Dialog } from '@/app/dashboard/components/ui/DashboardDialog';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';
import { DialogTitle } from '@/components/ui/dialog';

interface AddEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entries: ContentEntry[];
    onSelect: (entryIds: string[]) => void;
    /** Set to 1 for single-select mode (e.g. feature sections) */
    maxSelection?: number;
}

export function AddEntryModal({
    open,
    onOpenChange,
    entries,
    onSelect,
    maxSelection,
}: AddEntryModalProps) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isSingleSelect = maxSelection === 1;

    const filtered = search
        ? entries.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
        : entries;

    const toggleEntry = useCallback(
        (entryId: string) => {
            if (isSingleSelect) {
                // Single-select: immediately confirm
                onSelect([entryId]);
                onOpenChange(false);
                setSearch('');
                setSelectedIds(new Set());
                return;
            }
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(entryId)) {
                    next.delete(entryId);
                } else {
                    next.add(entryId);
                }
                return next;
            });
        },
        [isSingleSelect, onSelect, onOpenChange]
    );

    const toggleSelectAll = useCallback(() => {
        const allFilteredIds = filtered.map((e) => e.id);
        const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
        if (allSelected) {
            // Deselect all filtered
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const id of allFilteredIds) next.delete(id);
                return next;
            });
        } else {
            // Select all filtered
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const id of allFilteredIds) next.add(id);
                return next;
            });
        }
    }, [filtered, selectedIds]);

    const handleConfirm = () => {
        if (selectedIds.size === 0) return;
        onSelect(Array.from(selectedIds));
        onOpenChange(false);
        setSearch('');
        setSelectedIds(new Set());
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSearch('');
            setSelectedIds(new Set());
        }
        onOpenChange(nextOpen);
    };

    const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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

                {/* Select all toggle (multi-select only) */}
                {!isSingleSelect && filtered.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                    >
                        <span
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                allFilteredSelected
                                    ? 'border-dashboard-accent bg-dashboard-accent'
                                    : 'border-dashboard-border'
                            }`}
                        >
                            {allFilteredSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        Select all ({filtered.length})
                    </button>
                )}

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
                                const isChecked = selectedIds.has(entry.id);
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => toggleEntry(entry.id)}
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-dashboard-text-secondary hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                                    >
                                        {!isSingleSelect && (
                                            <span
                                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                                    isChecked
                                                        ? 'border-dashboard-accent bg-dashboard-accent'
                                                        : 'border-dashboard-border'
                                                }`}
                                            >
                                                {isChecked && (
                                                    <Check className="h-2.5 w-2.5 text-white" />
                                                )}
                                            </span>
                                        )}
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

                {/* Confirm button (multi-select only) */}
                {!isSingleSelect && (
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="w-full rounded-md bg-dashboard-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {selectedIds.size === 0
                            ? 'Select entries to add'
                            : `Add ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}`}
                    </button>
                )}
            </DashboardDialogContent>
        </Dialog>
    );
}
