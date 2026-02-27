'use client';

import { ENTRY_TYPE_CONFIG, type EntryType } from '@/app/dashboard/config/entryConfig';
import { EDITOR_MENU_CONFIG, resolveMenuItems } from '@/app/dashboard/config/menuConfig';
import { TypeBadge } from '@/components/dna';
import { useEntryDetail, useEntryMutations } from '../../hooks';
import { Button } from '@/components/ui/button';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';
import type { ContentEntry } from '@/types';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { type ComponentType, useState, useCallback, useRef, useEffect } from 'react';
import type { EntryEditorProps } from './editors/types';
import EventEditor from './editors/EventEditor';
import MixsetEditor from './editors/MixsetEditor';
import LinkEditor from './editors/LinkEditor';

const EDITOR_REGISTRY: Record<EntryType, ComponentType<EntryEditorProps>> = {
    event: EventEditor,
    mixset: MixsetEditor,
    link: LinkEditor,
};

// ============================================
// useDebouncedSave hook
// ============================================

function useDebouncedSave(onSave: (entry: ContentEntry) => Promise<void>, delay: number = 800) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const hasPendingSave = useCallback(() => timeoutRef.current !== null, []);

    const debouncedSave = useCallback(
        (entry: ContentEntry) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
                timeoutRef.current = null;
                setIsSaving(true);
                try {
                    await onSave(entry);
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('저장 실패:', error);
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
    const [editingField, setEditingField] = useState<'title' | 'image' | null>(null);

    // Save handler — preview refresh is handled by the mutation factory
    const handleSave = useCallback(
        async (updated: ContentEntry) => {
            await updateMutation.mutateAsync({ entry: updated });
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

    // Update field helper
    const handleUpdate = (updates: Partial<ContentEntry>) => {
        const updated = { ...localEntry, ...updates } as ContentEntry;
        setLocalEntry(updated);
        debouncedSave(updated);
    };

    const config = ENTRY_TYPE_CONFIG[localEntry.type];

    // Save status
    const getSaveStatus = () => {
        if (isSaving) return '저장 중...';
        if (lastSaved) {
            const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
            if (seconds < 5) return '저장됨';
        }
        return null;
    };

    const saveStatus = getSaveStatus();

    // "..." 메뉴 items — config-driven + declarative action resolution
    const menuItems = resolveMenuItems(EDITOR_MENU_CONFIG[localEntry.type], {
        setEditingField,
        onDelete: handleDelete,
    });

    const handleEditingDone = () => setEditingField(null);
    const Editor = EDITOR_REGISTRY[localEntry.type];

    return (
        <div className="flex h-full flex-col">
            {/* Back button (optional) */}
            {onBack && (
                <div className="border-b border-dashboard-border px-4 py-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        목록으로
                    </button>
                </div>
            )}

            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
                <div className="flex items-center gap-3">
                    <TypeBadge type={config.badgeType} />
                    {saveStatus && (
                        <span className="text-xs text-dashboard-text-muted">{saveStatus}</span>
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

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <p className="mb-4 text-xs text-dashboard-text-placeholder">
                    더블클릭하여 편집 · Enter로 저장 · Escape로 취소
                </p>
                <Editor
                    entry={localEntry}
                    onUpdate={handleUpdate}
                    editingField={editingField}
                    onEditingDone={handleEditingDone}
                />
            </div>
        </div>
    );
}
