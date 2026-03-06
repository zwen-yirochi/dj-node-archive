'use client';

import { useRef } from 'react';

import { Plus, X } from 'lucide-react';

import type { FieldComponentProps } from './types';

export interface KeyValueColumn {
    key: string;
    placeholder: string;
    className?: string;
    width?: string;
}

interface KeyValueFieldProps<T extends Record<string, string>> extends FieldComponentProps<T[]> {
    columns: KeyValueColumn[];
    emptyItem: T;
    addLabel?: string;
}

export default function KeyValueField<T extends Record<string, string>>({
    value,
    onChange,
    disabled,
    columns,
    emptyItem,
    addLabel = 'Add item',
}: KeyValueFieldProps<T>) {
    const nextKeyRef = useRef(0);
    const keysRef = useRef<string[]>([]);

    // Sync key array to match item count
    while (keysRef.current.length < value.length) {
        keysRef.current.push(String(nextKeyRef.current++));
    }
    keysRef.current.length = value.length;

    const updateCell = (rowIndex: number, colKey: string, cellValue: string) => {
        const next = value.map((row, i) =>
            i === rowIndex ? { ...row, [colKey]: cellValue } : row
        );
        onChange(next);
    };

    const addRow = () => onChange([...value, { ...emptyItem }]);

    const removeRow = (index: number) => {
        keysRef.current.splice(index, 1);
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            {value.map((row, rowIndex) => (
                <div
                    key={keysRef.current[rowIndex]}
                    className="group flex items-baseline gap-3 text-sm"
                >
                    {columns.map((col) => (
                        <div key={col.key} className={col.width}>
                            <input
                                type="text"
                                value={row[col.key] ?? ''}
                                onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                                disabled={disabled}
                                placeholder={col.placeholder}
                                className={`w-full bg-transparent outline-none placeholder:text-dashboard-text-placeholder ${col.className ?? 'text-dashboard-text-secondary'}`}
                            />
                        </div>
                    ))}
                    {!disabled && (
                        <button
                            onClick={() => removeRow(rowIndex)}
                            className="p-1 text-dashboard-text-placeholder opacity-0 transition-opacity hover:text-dashboard-danger group-hover:opacity-100"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            {!disabled && (
                <button
                    onClick={addRow}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
                >
                    <Plus className="h-3.5 w-3.5" />
                    {addLabel}
                </button>
            )}
        </div>
    );
}
