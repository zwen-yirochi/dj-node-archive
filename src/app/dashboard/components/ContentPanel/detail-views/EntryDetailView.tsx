'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertCircle, ArrowLeft, Check, Loader2, MoreHorizontal } from 'lucide-react';

import type { CustomEntry } from '@/types';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { canAddToView, getMissingFieldLabels } from '@/app/dashboard/config/entry/entry-validation';
import { EDITOR_MENU_CONFIG, resolveMenuItems } from '@/app/dashboard/config/ui/menu';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryDetail, useEntryMutations } from '../../../hooks';
import { useConfirmAction } from '../../../hooks/use-confirm-action';
import { selectSetView, useDashboardStore } from '../../../stores/dashboardStore';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import EventDetailView from '../detail-views/EventDetailView';
import LinkDetailView from '../detail-views/LinkDetailView';
import MixsetDetailView from '../detail-views/MixsetDetailView';
import { SyncedField, TEXT_FIELD_CONFIG, TextField } from '../shared-fields';
import CustomEntryEditor from './CustomEntryEditor';

// ============================================
// Header Save Indicator
// ============================================

function HeaderSaveIndicator({ status }: { status: 'idle' | 'pending' | 'success' | 'error' }) {
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (status === 'success') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
        setShowSuccess(false);
    }, [status]);

    if (status === 'pending') {
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-dashboard-text-muted" />;
    }

    if (showSuccess) {
        return <Check className="h-3.5 w-3.5 text-green-500 duration-200 animate-in fade-in" />;
    }

    if (status === 'error') {
        return (
            <span className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-dashboard-danger" />
                <span className="text-xs text-dashboard-danger">Save failed</span>
            </span>
        );
    }

    return null;
}

// ============================================
// EntryDetailView
// ============================================

interface EntryDetailViewProps {
    entryId: string;
    onBack?: () => void;
}

export default function EntryDetailView({ entryId, onBack }: EntryDetailViewProps) {
    const { data: entry } = useEntryDetail(entryId);
    const { updateField, remove: deleteMutation } = useEntryMutations();

    const setView = useDashboardStore(selectSetView);
    const confirmAction = useConfirmAction();

    // Field-level save — SyncedField debounce 후 직접 호출됨
    const handleFieldSave = useCallback(
        (fieldKey: string, value: unknown) => {
            updateField.mutate({ entryId, fieldKey, value });
        },
        [entryId, updateField]
    );

    // Custom entry — blocks save
    const handleBlocksSave = useCallback(
        (blocks: CustomEntry['blocks']) => {
            updateField.mutate({ entryId, fieldKey: 'blocks', value: blocks });
        },
        [entryId, updateField]
    );

    // Delete handler
    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(entry.id);
            if (onBack) {
                onBack();
            } else {
                setView({ kind: 'page' });
            }
        } catch {
            // mutateAsync error is handled by TanStack Query's onError
        }
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    // Warning for view-readiness
    const isViewReady = canAddToView(entry);
    const missingFields = isViewReady ? [] : getMissingFieldLabels(entry, 'create');

    // "..." menu items
    const menuConfig = EDITOR_MENU_CONFIG[entry.type];
    const handlers = confirmAction.wrapHandlers(
        menuConfig,
        { delete: handleDelete },
        entry as unknown as Record<string, unknown>
    );
    const menuItems = resolveMenuItems(menuConfig, handlers);

    return (
        <div className="flex h-full flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <TypeBadge type={config.badgeType} size="sm" />
                    <HeaderSaveIndicator status={updateField.status} />
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
                {entry.type === 'custom' ? (
                    <>
                        <div className="mb-6">
                            <SyncedField
                                config={TEXT_FIELD_CONFIG}
                                value={entry.title}
                                onSave={(v) => handleFieldSave('title', v)}
                            >
                                <TextField
                                    placeholder="Untitled"
                                    className="text-xl font-semibold text-dashboard-text"
                                />
                            </SyncedField>
                        </div>
                        <CustomEntryEditor
                            entry={entry as CustomEntry}
                            onBlocksChange={handleBlocksSave}
                        />
                    </>
                ) : entry.type === 'event' ? (
                    <EventDetailView entry={entry} onSave={handleFieldSave} />
                ) : entry.type === 'mixset' ? (
                    <MixsetDetailView entry={entry} onSave={handleFieldSave} />
                ) : entry.type === 'link' ? (
                    <LinkDetailView entry={entry} onSave={handleFieldSave} />
                ) : null}
            </div>

            <ConfirmDialog
                pending={confirmAction.pending}
                matchValue={confirmAction.matchValue}
                onConfirm={confirmAction.confirm}
                onClose={confirmAction.close}
            />
        </div>
    );
}
