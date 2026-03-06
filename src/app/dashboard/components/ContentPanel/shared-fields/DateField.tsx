'use client';

import type { FieldComponentProps } from './types';

interface DateFieldProps extends FieldComponentProps<string> {
    className?: string;
}

export default function DateField({ value, onChange, disabled, className }: DateFieldProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={className}>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
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
