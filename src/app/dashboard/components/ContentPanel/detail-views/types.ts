import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types';

import type { SaveOptions } from '../shared-fields/types';

export type { SaveOptions } from '../shared-fields/types';

export type FieldSaveFn = (fieldKey: string, value: unknown) => void;

/** @deprecated Use EventDetailViewProps | MixsetDetailViewProps | LinkDetailViewProps instead. Removed in Task 6. */
export interface DetailViewProps {
    entry: ContentEntry;
    onSave: (fieldKey: string, value: unknown, options?: SaveOptions) => void;
    disabled?: boolean;
}

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
