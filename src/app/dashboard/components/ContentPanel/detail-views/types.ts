import type { ContentEntry } from '@/types';

export interface SaveOptions {
    immediate?: boolean;
}

export type FieldSaveFn = (fieldKey: string, value: unknown, options?: SaveOptions) => void;

/** Detail view component props */
export interface DetailViewProps {
    entry: ContentEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}
