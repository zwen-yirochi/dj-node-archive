'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, Download, Plus } from 'lucide-react';

import { createEmptyEntry } from '@/lib/mappers';
import { toast } from '@/hooks/use-toast';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';

import { useEntries, useEntryMutations } from '../../../hooks';
import {
    selectGoBack,
    selectHasPreviousView,
    selectPageId,
    selectSetView,
    useDashboardStore,
} from '../../../stores/dashboardStore';
import EventImportSearch from './EventImportSearch';

// ============================================
// AutoCreateEntry: create immediately and navigate to editor
// Handles all entry types — checks for existing "Untitled" first
// ============================================
function AutoCreateEntry({ type }: { type: EntryType }) {
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const goBack = useDashboardStore(selectGoBack);
    const { create: createMutation } = useEntryMutations();
    const { data: entries } = useEntries();
    const hasCreated = useRef(false);

    useEffect(() => {
        if (hasCreated.current || !pageId) return;
        hasCreated.current = true;

        // Untitled prevention: reuse existing untitled entry of same type
        const existingUntitled = entries?.find((e) => e.type === type && e.title === 'Untitled');
        if (existingUntitled) {
            setView({ kind: 'detail', entryId: existingUntitled.id }, { replace: true });
            return;
        }

        const entry = createEmptyEntry(type);
        entry.title = 'Untitled';

        // Optimistic update handles entries.all cache — no detail cache needed
        createMutation.mutate(
            { pageId, entry },
            {
                onError: () => {
                    toast({
                        variant: 'destructive',
                        title: 'Creation failed',
                        description: `Failed to create ${ENTRY_TYPE_CONFIG[type].label.toLowerCase()} entry.`,
                    });
                    goBack();
                },
            }
        );

        // Navigate immediately — optimistic update already added to entries.all
        // replace: true → previousView stays as pre-create view, not the create view itself
        setView({ kind: 'detail', entryId: entry.id }, { replace: true });
    }, [pageId, createMutation, setView, goBack, entries, type]);

    return null;
}

// ============================================
// EventCreateRouter: Event-specific choice (Create new / Import from RA)
// ============================================
function EventCreateRouter() {
    const [mode, setMode] = useState<'choose' | 'create' | 'import'>('choose');
    const goBack = useDashboardStore(selectGoBack);
    const hasPreviousView = useDashboardStore(selectHasPreviousView);

    if (mode === 'create') return <AutoCreateEntry type="event" />;

    if (mode === 'import') {
        return (
            <div className="flex h-full flex-col bg-dashboard-bg-card">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMode('choose')}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <TypeBadge type="EVT" size="sm" />
                        <h2 className="text-lg font-medium text-dashboard-text">Import Event</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                    <EventImportSearch />
                </div>
            </div>
        );
    }

    // Choose mode
    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-5">
                <div className="flex items-center gap-3">
                    {hasPreviousView && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <TypeBadge type="EVT" size="sm" />
                    <h2 className="text-lg font-medium text-dashboard-text">New Event</h2>
                </div>
            </div>

            {/* Choice UI */}
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
                <Button
                    onClick={() => setMode('create')}
                    variant="outline"
                    className="flex w-64 items-center justify-center gap-2 border-dashboard-border py-6 text-dashboard-text hover:bg-dashboard-bg-muted"
                >
                    <Plus className="h-4 w-4" />
                    Create new
                </Button>
                <Button
                    onClick={() => setMode('import')}
                    variant="outline"
                    className="flex w-64 items-center justify-center gap-2 border-dashboard-border py-6 text-dashboard-text hover:bg-dashboard-bg-muted"
                >
                    <Download className="h-4 w-4" />
                    Import from RA
                </Button>
            </div>
        </div>
    );
}

// ============================================
// CreateEntryPanel: Simplified router
// ============================================
interface CreateEntryPanelProps {
    type: EntryType;
}

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    if (type === 'event') return <EventCreateRouter />;
    return <AutoCreateEntry type={type} />;
}
