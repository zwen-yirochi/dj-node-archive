'use client';

import { useEditorData, useEntryDetail, useEntryMutations } from '../../hooks';
import { Button } from '@/components/ui/button';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import { useDashboardUIStore } from '@/stores/contentEntryStore';
import type { ContentEntry } from '@/types';
import { isEventEntry, isMixsetEntry, isLinkEntry } from '@/types';
import {
    ArrowLeft,
    Calendar,
    Headphones,
    ImageIcon,
    Link as LinkIcon,
    MoreHorizontal,
    Trash2,
    Type,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import EventEditor from './editors/EventEditor';
import MixsetEditor from './editors/MixsetEditor';
import LinkEditor from './editors/LinkEditor';

// ============================================
// useDebouncedSave hook
// ============================================

function useDebouncedSave(onSave: (entry: ContentEntry) => Promise<void>, delay: number = 800) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const debouncedSave = useCallback(
        (entry: ContentEntry) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
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

    return { debouncedSave, isSaving, lastSaved };
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
    const { data: editorData } = useEditorData();

    // Mutations
    const { update: updateMutation, remove: deleteMutation } = useEntryMutations();
    const triggerPreviewRefresh = useDashboardUIStore((s) => s.triggerPreviewRefresh);

    // Local editing state
    const [localEntry, setLocalEntry] = useState<ContentEntry>(entry);
    const [editingField, setEditingField] = useState<'title' | 'image' | null>(null);

    // Sync external entry changes to local state
    useEffect(() => {
        setLocalEntry(entry);
    }, [entry]);

    // Save handler
    const handleSave = useCallback(
        async (updated: ContentEntry) => {
            const previousEntry = editorData.contentEntries.find((e) => e.id === updated.id);
            await updateMutation.mutateAsync({ entry: updated });
            if (previousEntry && shouldTriggerPreview(previousEntry, updated)) {
                triggerPreviewRefresh();
            }
        },
        [editorData.contentEntries, updateMutation, triggerPreviewRefresh]
    );

    const { debouncedSave, isSaving, lastSaved } = useDebouncedSave(handleSave);

    // Delete handler
    const handleDelete = async () => {
        const shouldRefresh = canAddToView(entry);
        await deleteMutation.mutateAsync(entry.id);
        if (shouldRefresh) {
            triggerPreviewRefresh();
        }
        onBack?.();
    };

    // Update field helper
    const handleUpdate = (updates: Partial<ContentEntry>) => {
        const updated = { ...localEntry, ...updates } as ContentEntry;
        setLocalEntry(updated);
        debouncedSave(updated);
    };

    // Type badge styling
    const getTypeColor = () => {
        switch (localEntry.type) {
            case 'event':
                return 'bg-blue-50 text-dashboard-type-event border-blue-200';
            case 'mixset':
                return 'bg-purple-50 text-dashboard-type-mixset border-purple-200';
            case 'link':
                return 'bg-green-50 text-dashboard-type-link border-green-200';
        }
    };

    const getTypeIcon = () => {
        switch (localEntry.type) {
            case 'event':
                return <Calendar className="h-4 w-4" />;
            case 'mixset':
                return <Headphones className="h-4 w-4" />;
            case 'link':
                return <LinkIcon className="h-4 w-4" />;
        }
    };

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

    // "..." 메뉴 items
    const menuItems: DropdownMenuItemConfig[] = [
        { label: '제목 변경', onClick: () => setEditingField('title'), icon: Type },
        { label: '이미지 변경', onClick: () => setEditingField('image'), icon: ImageIcon },
        { type: 'separator' },
        { label: '삭제', onClick: handleDelete, icon: Trash2, variant: 'danger' },
    ];

    const handleEditingDone = () => setEditingField(null);

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
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()}`}
                    >
                        {getTypeIcon()}
                        {localEntry.type}
                    </span>
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
                {isEventEntry(localEntry) && (
                    <EventEditor
                        entry={localEntry}
                        onUpdate={(updates) => handleUpdate(updates as Partial<ContentEntry>)}
                        editingField={editingField}
                        onEditingDone={handleEditingDone}
                    />
                )}
                {isMixsetEntry(localEntry) && (
                    <MixsetEditor
                        entry={localEntry}
                        onUpdate={(updates) => handleUpdate(updates as Partial<ContentEntry>)}
                        editingField={editingField}
                        onEditingDone={handleEditingDone}
                    />
                )}
                {isLinkEntry(localEntry) && (
                    <LinkEditor
                        entry={localEntry}
                        onUpdate={(updates) => handleUpdate(updates as Partial<ContentEntry>)}
                        editingField={editingField}
                        onEditingDone={handleEditingDone}
                    />
                )}
            </div>
        </div>
    );
}
