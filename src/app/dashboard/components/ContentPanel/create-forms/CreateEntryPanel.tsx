'use client';

import { useEffect, useRef, type ComponentType } from 'react';

import { ArrowLeft } from 'lucide-react';

import { createEmptyEntry } from '@/lib/mappers';
import { toast } from '@/hooks/use-toast';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';

import { useEntryMutations } from '../../../hooks';
import {
    selectGoBack,
    selectHasPreviousView,
    selectPageId,
    selectSetView,
    useDashboardStore,
} from '../../../stores/dashboardStore';
import CreateLinkForm from './CreateLinkForm';
import CreateMixsetForm from './CreateMixsetForm';
import EventCreateSection from './EventCreateSection';

// ============================================
// CustomAutoCreate: create immediately and navigate to editor (no loading)
// ============================================
function CustomAutoCreate() {
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const goBack = useDashboardStore(selectGoBack);
    const { create: createMutation } = useEntryMutations();
    const hasCreated = useRef(false);

    useEffect(() => {
        if (hasCreated.current || !pageId) return;
        hasCreated.current = true;

        const entry = createEmptyEntry('custom');
        entry.title = 'Untitled';

        // Optimistic update handles entries.all cache — no detail cache needed
        createMutation.mutate(
            { pageId, entry },
            {
                onError: () => {
                    toast({
                        variant: 'destructive',
                        title: 'Creation failed',
                        description: 'Failed to create custom entry.',
                    });
                    goBack();
                },
            }
        );

        // Navigate immediately — optimistic update already added to entries.all
        // replace: true → previousView stays as pre-create view, not the create view itself
        setView({ kind: 'detail', entryId: entry.id }, { replace: true });
    }, [pageId, createMutation, setView, goBack]);

    return null;
}

// ============================================
// Registry: EntryType -> dedicated form component
// ============================================
const FORM_REGISTRY: Partial<Record<EntryType, ComponentType>> = {
    event: EventCreateSection,
    mixset: CreateMixsetForm,
    link: CreateLinkForm,
};

// ============================================
// CreateEntryPanel: Registry-based rendering
// ============================================
interface CreateEntryPanelProps {
    type: EntryType;
}

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    // Custom: side-effect only, skip registry (no UI — creates and navigates immediately)
    if (type === 'custom') return <CustomAutoCreate />;

    const config = ENTRY_TYPE_CONFIG[type];
    const goBack = useDashboardStore(selectGoBack);
    const hasPreviousView = useDashboardStore(selectHasPreviousView);
    const DedicatedForm = FORM_REGISTRY[type];

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
                    <TypeBadge type={config.badgeType} size="sm" />
                    <h2 className="text-lg font-medium text-dashboard-text">New {config.label}</h2>
                </div>
            </div>

            {/* Content */}
            {DedicatedForm && (
                <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <DedicatedForm />
                    </div>
                </div>
            )}
        </div>
    );
}
