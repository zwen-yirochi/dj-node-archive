'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Loader2 } from 'lucide-react';

import { createEmptyEntry } from '@/lib/mappers';
import { toast } from '@/hooks/use-toast';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { entryKeys, useEntryMutations } from '../../hooks';
import { selectPageId, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import CreateMixsetForm from './CreateMixsetForm';
import EventCreateSection from './EventCreateSection';

// ============================================
// CustomAutoCreate: create immediately and navigate to editor (no loading)
// ============================================
function CustomAutoCreate() {
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const { create: createMutation } = useEntryMutations();
    const queryClient = useQueryClient();
    const hasCreated = useRef(false);

    useEffect(() => {
        if (hasCreated.current || !pageId) return;
        hasCreated.current = true;

        const entry = createEmptyEntry('custom');
        entry.title = 'Untitled';

        // Pre-populate detail cache so EntryDetailView renders instantly
        queryClient.setQueryData(entryKeys.detail(entry.id), entry);

        // Fire mutation in background (handles entries list + API call)
        createMutation.mutate(
            { pageId, entry },
            {
                onError: () => {
                    queryClient.removeQueries({ queryKey: entryKeys.detail(entry.id) });
                    toast({
                        variant: 'destructive',
                        title: 'Creation failed',
                        description: 'Failed to create custom entry.',
                    });
                    setView({ kind: 'page' });
                },
            }
        );

        // Navigate immediately — entry is already in detail cache
        setView({ kind: 'detail', entryId: entry.id });
    }, [pageId, createMutation, setView, queryClient]);

    return null;
}

// ============================================
// Registry: EntryType -> dedicated form component
// Registered types render a dedicated form; unregistered types use the default Title Input form
// ============================================
const FORM_REGISTRY: Partial<Record<EntryType, ComponentType>> = {
    event: EventCreateSection,
    mixset: CreateMixsetForm,
    custom: CustomAutoCreate,
};

// ============================================
// Default Form: for types without a dedicated form (currently link)
// ============================================
function DefaultCreateForm({ type }: { type: EntryType }) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const config = ENTRY_TYPE_CONFIG[type];
    const pageId = useDashboardStore(selectPageId);
    const { create: createEntryMutation } = useEntryMutations();
    const setView = useDashboardStore(selectSetView);

    const handleCreate = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Title required',
                description: 'Please enter a title.',
            });
            return;
        }
        if (!pageId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Page ID is not set. Please refresh the page.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const newEntry = createEmptyEntry(type);
            newEntry.title = title.trim();
            await createEntryMutation.mutateAsync({ pageId, entry: newEntry });
            setView({ kind: 'detail', entryId: newEntry.id });
            toast({ title: 'Created', description: `${config.label} has been created.` });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Creation failed',
                description: 'An error occurred while creating.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => setView({ kind: 'page' });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') handleCancel();
    };

    return (
        <>
            {/* Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-dashboard-text-secondary">
                        Title
                    </Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={config.titlePlaceholder}
                        autoFocus
                        autoComplete="off"
                        className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-dashboard-border/50 px-6 py-4">
                <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={!title.trim() || isSaving}
                    className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                </Button>
            </div>
        </>
    );
}

// ============================================
// CreateEntryPanel: Registry-based rendering
// ============================================
interface CreateEntryPanelProps {
    type: EntryType;
}

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    const config = ENTRY_TYPE_CONFIG[type];
    const setView = useDashboardStore(selectSetView);
    const DedicatedForm = FORM_REGISTRY[type];

    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-5">
                <div className="flex items-center gap-3">
                    <TypeBadge type={config.badgeType} size="sm" />
                    <h2 className="text-lg font-medium text-dashboard-text">New {config.label}</h2>
                </div>
                {DedicatedForm && (
                    <Button
                        onClick={() => setView({ kind: 'page' })}
                        variant="ghost"
                        size="sm"
                        className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Content: Registry lookup -> dedicated form or default form */}
            {DedicatedForm ? (
                <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <DedicatedForm />
                    </div>
                </div>
            ) : (
                <DefaultCreateForm type={type} />
            )}
        </div>
    );
}
