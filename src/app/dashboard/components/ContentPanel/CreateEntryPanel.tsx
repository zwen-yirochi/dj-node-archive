'use client';

import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import {
    EVENT_CREATE_OPTIONS,
    type EventCreateOption,
} from '@/app/dashboard/config/workflowOptions';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';
import { useEditorData, useEntryMutations } from '../../hooks';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { useDashboardStore } from '../../stores/dashboardStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import CreateEventForm from './CreateEventForm';
import EventImportSearch from './EventImportSearch';

interface CreateEntryPanelProps {
    type: EntryType;
}

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [eventOption, setEventOption] = useState<EventCreateOption>('create');

    // TanStack Query
    const { data } = useEditorData();
    const { create: createEntryMutation } = useEntryMutations();

    // Store
    const setView = useDashboardStore((state) => state.setView);
    const closeCreatePanel = useDashboardStore((state) => state.closeCreatePanel);

    const config = ENTRY_TYPE_CONFIG[type];

    const handleCreate = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Title required',
                description: 'Please enter a title.',
            });
            return;
        }

        if (!data.pageId) {
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

            await createEntryMutation.mutateAsync({
                pageId: data.pageId,
                entry: newEntry,
            });
            setView({ kind: 'detail', entryId: newEntry.id });

            toast({
                title: 'Created',
                description: `${config.label} has been created.`,
            });
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

    const handleCancel = () => {
        closeCreatePanel();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // Event 모드 판단
    const isEventImportMode = type === 'event' && eventOption === 'import';
    const isEventCreateMode = type === 'event' && eventOption === 'create';

    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div className="flex items-center gap-3">
                    <TypeBadge type={config.badgeType} />
                    <h2 className="text-xl font-semibold text-dashboard-text">
                        New {config.label}
                    </h2>
                </div>
                {/* Cancel button in header for Event */}
                {type === 'event' && (
                    <Button
                        onClick={handleCancel}
                        variant="ghost"
                        size="sm"
                        className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Event: Option Selector */}
                    {type === 'event' && (
                        <div className="space-y-2">
                            <Label className="text-dashboard-text-secondary">Source</Label>
                            <OptionSelector
                                options={EVENT_CREATE_OPTIONS}
                                value={eventOption}
                                onChange={setEventOption}
                            />
                        </div>
                    )}

                    {/* Event: Create New Form */}
                    {isEventCreateMode && <CreateEventForm />}

                    {/* Event Import: Search */}
                    {isEventImportMode && <EventImportSearch />}

                    {/* Non-Event: Simple Title Input */}
                    {type !== 'event' && (
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
                    )}
                </div>
            </div>

            {/* Footer - Non-Event only */}
            {type !== 'event' && (
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
            )}
        </div>
    );
}
