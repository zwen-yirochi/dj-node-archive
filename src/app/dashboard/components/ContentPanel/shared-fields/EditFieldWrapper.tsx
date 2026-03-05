'use client';

import type { ReactNode } from 'react';

import type { ZodSchema } from 'zod';

import type { SaveStatus } from '@/app/dashboard/hooks/use-field-sync';
import type { UseSaveHook } from '@/app/dashboard/hooks/use-immediate-save';

export interface EditFieldConfig<T> {
    useSave: UseSaveHook<T>;
    schema?: ZodSchema;
}

interface EditFieldWrapperProps<T> {
    config: EditFieldConfig<T>;
    value: T;
    onSave: (value: T) => void;
    children: (renderProps: {
        value: T;
        onChange: (value: T) => void;
        saveStatus: SaveStatus;
    }) => ReactNode;
}

/**
 * Edit 모드 전용 래퍼 — config.useSave로 저장 전략 실행, config.schema로 Zod 검증.
 * 코어 필드 컴포넌트를 render props로 감싸서 value/onChange/saveStatus를 주입한다.
 */
export default function EditFieldWrapper<T>({
    config,
    value,
    onSave,
    children,
}: EditFieldWrapperProps<T>) {
    const { localValue, setLocalValue, saveStatus } = config.useSave(value, (v: T) => {
        if (config.schema) {
            const result = config.schema.safeParse(v);
            if (!result.success) return;
        }
        onSave(v);
    });

    return children({ value: localValue, onChange: setLocalValue, saveStatus });
}
