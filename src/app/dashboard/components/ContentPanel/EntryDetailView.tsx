'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';

import { AlertCircle, ArrowLeft, MoreHorizontal } from 'lucide-react';

import type { ContentEntry, CustomEntry } from '@/types';
import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import { canAddToView, getMissingFieldLabels } from '@/app/dashboard/config/entryFieldConfig';
import { EDITOR_MENU_CONFIG, resolveMenuItems } from '@/app/dashboard/config/menuConfig';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryDetail, useEntryMutations } from '../../hooks';
import { DashboardConfirmDialog } from '../ui/DashboardDialog';
import CustomEntryEditor from './CustomEntryEditor';
import EventDetailView from './detail-views/EventDetailView';
import LinkDetailView from './detail-views/LinkDetailView';
import MixsetDetailView from './detail-views/MixsetDetailView';
import type { DetailViewProps } from './detail-views/types';

// ============================================
// Detail View Registry
// ============================================

const DETAIL_VIEW_REGISTRY: Record<Exclude<EntryType, 'custom'>, ComponentType<DetailViewProps>> = {
    event: EventDetailView,
    mixset: MixsetDetailView,
    link: LinkDetailView,
};

// ============================================
// useDebouncedSave hook
// ============================================

function useDebouncedSave(
    onSave: (entry: ContentEntry, changedFields: string[]) => Promise<void>,
    delay: number = 800
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const hasPendingSave = useCallback(() => timeoutRef.current !== null, []);

    const pendingFieldsRef = useRef<Set<string>>(new Set());

    const debouncedSave = useCallback(
        (entry: ContentEntry, changedFields: string[]) => {
            for (const key of changedFields) pendingFieldsRef.current.add(key);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
                timeoutRef.current = null;
                const fields = [...pendingFieldsRef.current];
                pendingFieldsRef.current.clear();
                setIsSaving(true);
                try {
                    await onSave(entry, fields);
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('Save failed:', error);
                } finally {
                    setIsSaving(false);
                }
            }, delay);
        },
        [onSave, delay]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { debouncedSave, isSaving, lastSaved, hasPendingSave };
}

// ============================================
// EntryDetailView
// ============================================

interface EntryDetailViewProps {
    entryId: string;
    onBack?: () => void;
}

export default function EntryDetailView({ entryId, onBack }: EntryDetailViewProps) {
    // Data
    const { data: entry } = useEntryDetail(entryId);

    // Mutations
    const { update: updateMutation, remove: deleteMutation } = useEntryMutations();

    // Local editing state
    const [localEntry, setLocalEntry] = useState<ContentEntry>(entry);
    const localEntryRef = useRef(localEntry);
    localEntryRef.current = localEntry;

    const [editingField, setEditingField] = useState<'title' | 'image' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Save handler — pass changedFields to mutation for preview trigger decision
    const handleSave = useCallback(
        async (updated: ContentEntry, changedFields: string[]) => {
            await updateMutation.mutateAsync({ entry: updated, changedFields });
        },
        [updateMutation]
    );

    const { debouncedSave, isSaving, lastSaved, hasPendingSave } = useDebouncedSave(handleSave);

    // Sync external entry changes to local state — skip during pending/in-flight saves
    // to prevent server refetch from overwriting edits in progress
    useEffect(() => {
        if (!isSaving && !hasPendingSave()) {
            setLocalEntry(entry);
        }
    }, [entry, isSaving, hasPendingSave]);

    // Delete handler — preview refresh is handled by the mutation factory
    const handleDelete = async () => {
        await deleteMutation.mutateAsync(entry.id);
        onBack?.();
    };

    const handleDeleteClick = () => setIsDeleteDialogOpen(true);

    // Field-level save — always reference latest localEntry via ref
    const handleFieldSave = useCallback(
        (fieldKey: string, value: unknown) => {
            const updated = { ...localEntryRef.current, [fieldKey]: value } as ContentEntry;
            setLocalEntry(updated);
            debouncedSave(updated, [fieldKey]);
        },
        [debouncedSave]
    );

    const config = ENTRY_TYPE_CONFIG[localEntry.type];

    // Save status
    const getSaveStatus = () => {
        if (isSaving) return 'Saving...';
        if (lastSaved) {
            const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
            if (seconds < 5) return 'Saved';
        }
        return null;
    };

    const saveStatus = getSaveStatus();

    // Warning for view-readiness
    const isViewReady = canAddToView(localEntry);
    const missingFields = isViewReady ? [] : getMissingFieldLabels(localEntry, 'create');

    // "..." menu items — config-driven + declarative action resolution
    const menuItems = resolveMenuItems(EDITOR_MENU_CONFIG[localEntry.type], {
        'edit-title': () => setEditingField('title'),
        'edit-image': () => setEditingField('image'),
        delete: handleDeleteClick,
    });

    const handleEditingDone = () => setEditingField(null);
    const DetailView =
        localEntry.type !== 'custom'
            ? DETAIL_VIEW_REGISTRY[localEntry.type as keyof typeof DETAIL_VIEW_REGISTRY]
            : null;

    return (
        <div className="flex h-full flex-col">
            {/* Back button (optional) */}
            {onBack && (
                <div className="border-b border-dashboard-border/50 px-4 py-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>
            )}

            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    <TypeBadge type={config.badgeType} size="sm" />
                    {saveStatus && (
                        <span className="text-xs text-dashboard-text-muted">{saveStatus}</span>
                    )}
                    {!isViewReady && (
                        <span
                            title={`Required to add to Page: ${missingFields.join(', ')}`}
                            className="flex items-center gap-1.5"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-dashboard-warning" />
                            <span className="text-xs text-dashboard-warning">Incomplete</span>
                        </span>
                    )}
                </div>
                <SimpleDropdown
                    trigger={
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    }
                    items={menuItems}
                />
            </div>

            {/* Detail View Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                {localEntry.type === 'custom' ? (
                    <>
                        <input
                            value={localEntry.title}
                            onChange={(e) => handleFieldSave('title', e.target.value)}
                            placeholder="Untitled"
                            className="mb-6 w-full bg-transparent text-xl font-semibold text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                        />
                        <CustomEntryEditor
                            entry={localEntry as CustomEntry}
                            onBlocksChange={(blocks) => {
                                const updated = { ...localEntry, blocks } as CustomEntry;
                                setLocalEntry(updated as ContentEntry);
                                debouncedSave(updated as ContentEntry, ['blocks']);
                            }}
                        />
                    </>
                ) : DetailView ? (
                    <DetailView
                        entry={localEntry}
                        onSave={handleFieldSave}
                        editingField={editingField}
                        onEditingDone={handleEditingDone}
                    />
                ) : null}
            </div>

            <DashboardConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete this entry?"
                description="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                destructive
                onConfirm={handleDelete}
            />
        </div>
    );
}
