'use client';

import type { ReactNode } from 'react';

import type { ZodSchema } from 'zod';

import { useFieldSync, type SaveStatus } from '@/app/dashboard/hooks/use-field-sync';

import type { SaveOptions } from '../detail-views/types';

export interface FieldSyncConfig<T> {
    /** true면 즉시 저장 (이미지, 토글 등), false/생략이면 디바운스 저장 (텍스트 등) */
    immediate?: boolean;
    schema?: ZodSchema;
    /** 디바운스 ms (immediate가 아닐 때만 사용, 기본 800) */
    debounceMs?: number;
}

interface FieldSyncProps<T> {
    config: FieldSyncConfig<T>;
    value: T;
    onSave: (value: T, options?: SaveOptions) => void;
    /** schema 검증 실패 시 호출 — UI 피드백용 (toast 등) */
    onValidationError?: (value: T, error: string) => void;
    children: (renderProps: {
        value: T;
        onChange: (value: T) => void;
        saveStatus: SaveStatus;
    }) => ReactNode;
}

/**
 * Edit 모드 전용 래퍼 — config.immediate로 저장 전략 결정, config.schema로 Zod 검증.
 * immediate: true → passthrough (로컬 상태 없음, 변경 즉시 onSave)
 * immediate: false → useFieldSync 디바운스 (로컬 상태 + 800ms 후 onSave)
 */
export default function FieldSync<T>({
    config,
    value,
    onSave,
    onValidationError,
    children,
}: FieldSyncProps<T>) {
    const immediate = config.immediate ?? false;

    const handleSave = (v: T) => {
        if (config.schema) {
            const result = config.schema.safeParse(v);
            if (!result.success) {
                onValidationError?.(v, result.error.issues[0]?.message ?? 'Validation failed');
                return;
            }
        }
        onSave(v, { immediate });
    };

    if (immediate) {
        return children({ value, onChange: handleSave, saveStatus: 'idle' });
    }

    return (
        <DebouncedInner value={value} onSave={handleSave} debounceMs={config.debounceMs}>
            {children}
        </DebouncedInner>
    );
}

/** 디바운스 모드 — useFieldSync를 사용하므로 별도 컴포넌트로 분리 (훅 조건부 호출 방지) */
function DebouncedInner<T>({
    value,
    onSave,
    debounceMs = 800,
    children,
}: {
    value: T;
    onSave: (v: T) => void;
    debounceMs?: number;
    children: (renderProps: {
        value: T;
        onChange: (value: T) => void;
        saveStatus: SaveStatus;
    }) => ReactNode;
}) {
    const { localValue, setLocalValue, saveStatus } = useFieldSync({
        value,
        onSave,
        debounceMs,
    });

    return children({ value: localValue, onChange: setLocalValue, saveStatus });
}
