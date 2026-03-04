'use client';

import * as React from 'react';
import { useCallback, useRef } from 'react';

/**
 * 디바운스 훅 - 함수 호출을 지연시킵니다.
 *
 * callback을 ref로 감싸 반환 함수의 참조가 안정적으로 유지됩니다.
 * cancel() 메서드로 대기 중인 호출을 취소할 수 있습니다.
 *
 * @param callback - 디바운스할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운스된 함수 (cancel 메서드 포함)
 *
 * @example
 * const debouncedSave = useDebounce(async (data) => {
 *     await saveToServer(data);
 * }, 500);
 *
 * // 호출할 때마다 타이머가 리셋됨
 * debouncedSave(newData);
 *
 * // 대기 중인 호출 취소
 * debouncedSave.cancel();
 */
export type DebouncedFn<T extends (...args: any[]) => void> = T & { cancel: () => void };

export function useDebounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): DebouncedFn<T> {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const debounced = useCallback(
        ((...args: Parameters<T>) => {
            cancel();
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        }) as T,
        [delay, cancel]
    );

    return Object.assign(debounced, { cancel }) as DebouncedFn<T>;
}

/**
 * 디바운스된 값 훅 - 값이 변경된 후 일정 시간이 지나면 업데이트
 *
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (ms)
 * @returns 디바운스된 값
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
