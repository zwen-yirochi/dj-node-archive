'use client';

import {
    useEditorData,
    useEntryDetail,
    useUpdateEntry,
    useDeleteEntry,
} from '../../hooks/use-entries';
import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import { useDashboardUIStore } from '@/stores/contentEntryStore';
import type { ContentEntry } from '@/types';
import { ArrowLeft } from 'lucide-react';
import InlineEditMode from './InlineEditMode';

interface EntryDetailViewProps {
    entryId: string;
    onBack: () => void;
}

export default function EntryDetailView({ entryId, onBack }: EntryDetailViewProps) {
    const { data: entry } = useEntryDetail(entryId);
    const updateEntryMutation = useUpdateEntry();
    const deleteEntryMutation = useDeleteEntry();
    const triggerPreviewRefresh = useDashboardUIStore((state) => state.triggerPreviewRefresh);
    const { data: editorData } = useEditorData();

    const handleSave = async (updated: ContentEntry) => {
        const previousEntry = editorData.contentEntries.find((e) => e.id === updated.id);
        await updateEntryMutation.mutateAsync({ entry: updated });
        if (previousEntry && shouldTriggerPreview(previousEntry, updated)) {
            triggerPreviewRefresh();
        }
    };

    const handleDelete = async () => {
        const shouldRefresh = canAddToView(entry);
        await deleteEntryMutation.mutateAsync(entry.id);
        if (shouldRefresh) {
            triggerPreviewRefresh();
        }
        onBack();
    };

    return (
        <div className="flex h-full flex-col">
            {/* Back button */}
            <div className="border-b border-dashboard-border px-4 py-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                >
                    <ArrowLeft className="h-4 w-4" />
                    목록으로
                </button>
            </div>

            {/* Inline edit */}
            <div className="flex-1 overflow-hidden">
                <InlineEditMode component={entry} onSave={handleSave} onDelete={handleDelete} />
            </div>
        </div>
    );
}
