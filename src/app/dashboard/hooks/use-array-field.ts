/**
 * 배열 필드 CRUD 훅
 *
 * LinksEditor, TracklistEditor 등 동일 패턴의
 * add / update / remove 로직을 공통화.
 *
 * `keys` 배열을 반환하여 안정적인 React key 제공
 * (index 기반 key 대신 사용하여 reorder/remove 시 상태 꼬임 방지).
 */

import { useRef } from 'react';

export function useArrayField<T extends Record<string, unknown>>(
    items: T[],
    onSave: (items: T[]) => void,
    defaultItem: T
) {
    const nextKeyRef = useRef(0);
    const keysRef = useRef<string[]>([]);

    // 아이템 수에 맞게 키 배열 동기화
    while (keysRef.current.length < items.length) {
        keysRef.current.push(String(nextKeyRef.current++));
    }
    keysRef.current.length = items.length;

    const add = () => onSave([...items, defaultItem]);

    const update = <K extends keyof T>(index: number, field: K, value: T[K]) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        onSave(next);
    };

    const remove = (index: number) => {
        keysRef.current.splice(index, 1);
        onSave(items.filter((_, i) => i !== index));
    };

    return { add, update, remove, keys: keysRef.current };
}
