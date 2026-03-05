'use client';

import type { SaveStatus } from './use-field-sync';

export interface SaveSyncReturn<T> {
    localValue: T;
    setLocalValue: (value: T) => void;
    saveStatus: SaveStatus;
}

export type UseSaveHook<T> = (value: T, onSave: (value: T) => void) => SaveSyncReturn<T>;

/**
 * 즉시 저장 훅 — 이미지, 날짜, 토글 등 변경 즉시 저장하는 필드용.
 * localValue = 외부 value 그대로, setLocalValue = onSave 직접 호출.
 */
export function useImmediateSave<T>(value: T, onSave: (v: T) => void): SaveSyncReturn<T> {
    return { localValue: value, setLocalValue: onSave, saveStatus: 'idle' as const };
}
