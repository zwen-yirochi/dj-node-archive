'use client';

import { useState, type ComponentType } from 'react';

import { Loader2 } from 'lucide-react';

import { createEmptyEntry } from '@/lib/mappers';
import { toast } from '@/hooks/use-toast';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useEntryMutations } from '../../hooks';
import { selectPageId, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import CreateMixsetForm from './CreateMixsetForm';
import EventCreateSection from './EventCreateSection';

// ============================================
// Registry: EntryType -> dedicated form component
// Registered types render a dedicated form; unregistered types use the default Title Input form
// ============================================
const FORM_REGISTRY: Partial<Record<EntryType, ComponentType>> = {
    event: EventCreateSection,
    mixset: CreateMixsetForm,
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
            <div className="flex-1 overflow-y-auto p-6">
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
            <div className="flex items-center justify-end gap-3 border-t border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
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
            <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div className="flex items-center gap-3">
                    <TypeBadge type={config.badgeType} size="sm" />
                    <h2 className="text-xl font-semibold text-dashboard-text">
                        New {config.label}
                    </h2>
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
                <div className="flex-1 overflow-y-auto p-6">
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
