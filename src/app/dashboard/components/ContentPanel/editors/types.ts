import type { ContentEntry } from '@/types';

export interface EntryEditorProps {
    entry: ContentEntry;
    onUpdate: (updates: Partial<ContentEntry>) => void;
    editingField: 'title' | 'image' | null;
    onEditingDone: () => void;
}
