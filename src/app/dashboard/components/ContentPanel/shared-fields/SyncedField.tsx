'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { useFieldSync } from '@/app/dashboard/hooks/use-field-sync';

import SaveIndicator from './SaveIndicator';
import type { FieldSyncConfig } from './types';

interface SyncedFieldProps<T> {
    config: FieldSyncConfig<T>;
    value: T;
    onSave: (value: T) => void;
    /** 필드 컴포넌트 — value/onChange가 cloneElement로 주입된다 */
    children: ReactNode;
    /** indicator 위치: inline(기본)=오른쪽 옆, top-right=우상단 absolute */
    indicatorPosition?: 'inline' | 'top-right';
}

/**
 * SyncedField — config 기반 sync 전략 + save indicator 내장.
 *
 * immediate: true → passthrough (변경 즉시 onSave, schema 검증 후)
 * immediate: false → useFieldSync debounce (로컬 상태 + 디바운스 후 onSave)
 *
 * children에 value/onChange를 cloneElement로 주입한다.
 */
export default function SyncedField<T>({
    config,
    value,
    onSave,
    children,
    indicatorPosition = 'inline',
}: SyncedFieldProps<T>) {
    const immediate = config.immediate ?? false;

    const validate = (v: T): boolean => {
        if (!config.schema) return true;
        return config.schema.safeParse(v).success;
    };

    if (immediate) {
        const handleChange = (v: T) => {
            if (!validate(v)) return;
            onSave(v);
        };

        return (
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    {isValidElement(children) &&
                        cloneElement(children as ReactElement<Record<string, unknown>>, {
                            value,
                            onChange: handleChange,
                        })}
                </div>
                <div className="flex h-6 items-center pt-1">
                    <span className="inline-block h-3 w-3 shrink-0" />
                </div>
            </div>
        );
    }

    return (
        <DebouncedSyncedField
            config={config}
            value={value}
            onSave={onSave}
            validate={validate}
            indicatorPosition={indicatorPosition}
        >
            {children}
        </DebouncedSyncedField>
    );
}

/** 디바운스 모드 — useFieldSync 사용 (훅 조건부 호출 방지용 분리) */
function DebouncedSyncedField<T>({
    config,
    value,
    onSave,
    validate,
    children,
    indicatorPosition = 'inline',
}: {
    config: FieldSyncConfig<T>;
    value: T;
    onSave: (value: T) => void;
    validate: (v: T) => boolean;
    children: ReactNode;
    indicatorPosition?: 'inline' | 'top-right';
}) {
    const handleSave = (v: T) => {
        if (!validate(v)) return;
        onSave(v);
    };

    const { localValue, setLocalValue, saveStatus } = useFieldSync({
        value,
        onSave: handleSave,
        debounceMs: config.debounceMs,
    });

    const field =
        isValidElement(children) &&
        cloneElement(children as ReactElement<Record<string, unknown>>, {
            value: localValue,
            onChange: setLocalValue,
        });

    if (indicatorPosition === 'top-right') {
        return (
            <div className="relative">
                {field}
                <div className="pointer-events-none absolute -top-8 right-0">
                    <SaveIndicator status={saveStatus} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{field}</div>
            <div className="flex h-6 items-center pt-1">
                <SaveIndicator status={saveStatus} />
            </div>
        </div>
    );
}
