import type { ComponentType } from 'react';

import type { ZodSchema } from 'zod';

import type { ContentEntry } from '@/types';

/** 모든 필드 블록의 공통 props */
export interface FieldBlockProps {
    entry: ContentEntry;
    onSave: (fieldKey: string, value: unknown) => void;
    disabled?: boolean;
}

/** 필드 블록 설정 */
export interface FieldBlockConfig {
    key: string;
    label: string;
    schema: ZodSchema;
    component: ComponentType<FieldBlockProps>;
}

/** 상세보기 컴포넌트 props */
export interface DetailViewProps {
    entry: ContentEntry;
    onSave: (fieldKey: string, value: unknown) => void;
    editingField: 'title' | 'image' | null;
    onEditingDone: () => void;
    disabled?: boolean;
}
