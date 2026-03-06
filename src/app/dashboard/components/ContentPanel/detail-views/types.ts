import type { EventEntry, LinkEntry, MixsetEntry } from '@/types';

export type FieldSaveFn = (fieldKey: string, value: unknown) => void;

export interface EventDetailViewProps {
    entry: EventEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}

export interface MixsetDetailViewProps {
    entry: MixsetEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}

export interface LinkDetailViewProps {
    entry: LinkEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}
