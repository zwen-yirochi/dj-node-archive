'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseFieldSyncOptions<T> {
    /** 서버 상태 (외부에서 주입) */
    value: T;
    /** 저장 콜백 — 디바운스 후 호출됨 */
    onSave: (value: T) => void;
    /** 디바운스 ms (기본 800) */
    debounceMs?: number;
    /** 비교 함수 (기본: JSON.stringify 비교) */
    isEqual?: (a: T, b: T) => boolean;
}

interface UseFieldSyncReturn<T> {
    /** 낙관적 로컬 상태 */
    localValue: T;
    /** 로컬 업데이트 + 디바운스 저장 트리거 */
    setLocalValue: (value: T) => void;
    /** 저장 상태 */
    saveStatus: SaveStatus;
}

const defaultIsEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function useFieldSync<T>({
    value,
    onSave,
    debounceMs = 800,
    isEqual = defaultIsEqual,
}: UseFieldSyncOptions<T>): UseFieldSyncReturn<T> {
    const [localValue, setLocalState] = useState<T>(value);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
    const latestLocalRef = useRef<T>(localValue);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    // 외부 값 동기화 — 디바운스 대기 중이 아니면 서버 값으로 업데이트
    useEffect(() => {
        if (!timeoutRef.current && !isEqual(latestLocalRef.current, value)) {
            setLocalState(value);
            latestLocalRef.current = value;
        }
    }, [value, isEqual]);

    const setLocalValue = useCallback(
        (newValue: T) => {
            setLocalState(newValue);
            latestLocalRef.current = newValue;
            setSaveStatus('saving');

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                onSaveRef.current(newValue);
                setSaveStatus('saved');

                // 2초 후 idle로 복귀
                savedTimerRef.current = setTimeout(() => {
                    savedTimerRef.current = null;
                    setSaveStatus('idle');
                }, 2000);
            }, debounceMs);
        },
        [debounceMs]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    return { localValue, setLocalValue, saveStatus };
}
