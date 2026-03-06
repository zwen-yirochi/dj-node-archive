'use client';

import type { FieldComponentProps } from './types';

interface DateFieldProps extends FieldComponentProps<string> {
    className?: string;
}

function formatDate(dateStr: string): string | null {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export default function DateField({ value = '', onChange, disabled, className }: DateFieldProps) {
    return (
        <div className={`rounded-md border border-dashboard-border px-3 py-1.5 ${className ?? ''}`}>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                className="w-full bg-transparent text-dashboard-text-secondary outline-none"
            />
            {value && (
                <p className="mt-0.5 text-xs text-dashboard-text-placeholder">
                    {formatDate(value)}
                </p>
            )}
        </div>
    );
}
