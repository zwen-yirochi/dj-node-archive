'use client';

import {
    ENTRY_TYPE_CONFIG,
    EVENT_CREATE_OPTIONS,
    type EventCreateOption,
} from '@/app/dashboard/entries/entry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { type EntryType, useUIStore } from '@/stores/uiStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import OptionSelector from '../../../../components/ui/OptionSelector';

interface CreateEntryPanelProps {
    type: EntryType;
}

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [eventOption, setEventOption] = useState<EventCreateOption>('create');

    // Stores
    const createEntry = useContentEntryStore((state) => state.createEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);
    const closeCreatePanel = useUIStore((state) => state.closeCreatePanel);
    const selectEntry = useUIStore((state) => state.selectEntry);

    const config = ENTRY_TYPE_CONFIG[type];
    const Icon = config.icon;

    const handleCreate = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Title required',
                description: 'Please enter a title.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const newEntry = createEmptyEntry(type);
            newEntry.title = title.trim();

            await createEntry(newEntry);
            finishCreatingEntry(newEntry.id);
            triggerPreviewRefresh();
            closeCreatePanel();
            selectEntry(newEntry.id);

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

    // Event: Import 옵션 선택 시 (추후 검색 UI 구현)
    const isEventImportMode = type === 'event' && eventOption === 'import';

    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor} ${config.textColor}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-dashboard-text">
                        New {config.label}
                    </h2>
                </div>
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

                    {/* Title Input (Create mode only) */}
                    {!isEventImportMode && (
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
                                autoFocus={type !== 'event'}
                                className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                            />
                        </div>
                    )}

                    {/* Event Import: Search UI placeholder */}
                    {isEventImportMode && (
                        <div className="space-y-2">
                            <Label className="text-dashboard-text-secondary">Search</Label>
                            <Input
                                placeholder="Search events..."
                                className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                            />
                            <p className="text-xs text-dashboard-text-muted">
                                Event import feature coming soon
                            </p>
                        </div>
                    )}
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
                    disabled={isEventImportMode || !title.trim() || isSaving}
                    className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                </Button>
            </div>
        </div>
    );
}
