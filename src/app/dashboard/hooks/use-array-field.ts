/**
 * Array field CRUD hook
 *
 * Extracts shared add / update / remove logic
 * for LinksEditor, TracklistEditor, and similar patterns.
 *
 * Returns a `keys` array for stable React keys
 * (used instead of index-based keys to prevent state corruption on reorder/remove).
 */

import { useRef } from 'react';

export function useArrayField<T extends Record<string, unknown>>(
    items: T[],
    onSave: (items: T[]) => void,
    defaultItem: T
) {
    const nextKeyRef = useRef(0);
    const keysRef = useRef<string[]>([]);

    // Sync key array to match item count
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
