'use client';

import { useCallback, useRef } from 'react';

/**
 * 디바운스 훅 - 함수 호출을 지연시킵니다.
 *
 * @param callback - 디바운스할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운스된 함수
 *
 * @example
 * const debouncedSave = useDebounce(async (data) => {
 *     await saveToServer(data);
 * }, 500);
 *
 * // 호출할 때마다 타이머가 리셋됨
 * debouncedSave(newData);
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
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

import * as React from 'react';
