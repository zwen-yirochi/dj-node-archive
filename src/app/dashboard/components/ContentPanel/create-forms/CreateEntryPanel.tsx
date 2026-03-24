'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowLeft } from 'lucide-react';

import { createEmptyEntry } from '@/lib/mappers';
import { toast } from '@/hooks/use-toast';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entry/entry-types';
import { TypeBadge } from '@/components/dna';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';

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
        if (hasCreated.current || !pageId || !entries) return;
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
type EventCreateOption = 'create' | 'import' | 'ra-url';

const EVENT_CREATE_OPTIONS: { id: EventCreateOption; label: string; description: string }[] = [
    { id: 'create', label: 'Create new', description: 'Start from scratch' },
    {
        id: 'import',
        label: 'Search database',
        description: 'Search and import from existing events',
    },
    {
        id: 'ra-url',
        label: 'Import from RA URL',
        description: 'Paste a Resident Advisor event link (coming soon)',
    },
];

function EventCreateRouter() {
    const [option, setOption] = useState<EventCreateOption>('create');
    const [confirmed, setConfirmed] = useState(false);
    const goBack = useDashboardStore(selectGoBack);
    const hasPreviousView = useDashboardStore(selectHasPreviousView);

    if (confirmed && option === 'create') return <AutoCreateEntry type="event" />;

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

            {/* Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-dashboard-text-secondary">Source</Label>
                        <OptionSelector
                            options={EVENT_CREATE_OPTIONS}
                            value={option}
                            onChange={(v) => {
                                setOption(v);
                                setConfirmed(false);
                            }}
                        />
                    </div>

                    {option === 'create' && (
                        <button
                            onClick={() => setConfirmed(true)}
                            className="w-full rounded-md bg-dashboard-text px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-dashboard-text/90"
                        >
                            Create Event
                        </button>
                    )}

                    {option === 'import' && <EventImportSearch />}

                    {option === 'ra-url' && (
                        <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-4 text-center">
                            <p className="text-sm text-dashboard-text-muted">
                                Coming soon — paste an RA event URL to import
                            </p>
                        </div>
                    )}
                </div>
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
