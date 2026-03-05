'use client';

import { useFieldSync } from './use-field-sync';
import type { SaveSyncReturn } from './use-immediate-save';

/**
 * 디바운스 저장 훅 — 텍스트 등 keystroke 디바운스 후 저장하는 필드용.
 * useFieldSync를 래핑하여 UseSaveHook 인터페이스에 맞춘다.
 */
export function useDebouncedSave<T>(value: T, onSave: (v: T) => void): SaveSyncReturn<T> {
    return useFieldSync({ value, onSave, debounceMs: 800 });
}
