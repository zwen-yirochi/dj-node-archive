import type { ComponentType } from 'react';

import type { ZodSchema } from 'zod';

import type { ContentEntry } from '@/types';

export interface SaveOptions {
    immediate?: boolean;
}

export type FieldSaveFn = (fieldKey: string, value: unknown, options?: SaveOptions) => void;

/** Common props for all field blocks */
export interface FieldBlockProps {
    entry: ContentEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}

/** Field block configuration */
export interface FieldBlockConfig {
    key: string;
    label: string;
    schema: ZodSchema;
    component: ComponentType<FieldBlockProps>;
}

/** Detail view component props */
export interface DetailViewProps {
    entry: ContentEntry;
    onSave: FieldSaveFn;
    editingField: 'title' | null;
    onEditingDone: () => void;
    disabled?: boolean;
}
