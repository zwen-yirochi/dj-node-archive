'use client';

import type { FieldComponentProps } from './types';

interface TextFieldProps extends FieldComponentProps<string> {
    variant?: 'input' | 'textarea';
    placeholder?: string;
    rows?: number;
    className?: string;
    'aria-label'?: string;
}

export default function TextField({
    value,
    onChange,
    disabled,
    variant = 'input',
    placeholder,
    rows = 4,
    className,
    'aria-label': ariaLabel,
}: TextFieldProps) {
    const baseClass = `w-full bg-transparent outline-none placeholder:text-dashboard-text-placeholder ${className ?? 'text-sm text-dashboard-text-secondary'}`;

    if (variant === 'textarea') {
        return (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={rows}
                aria-label={ariaLabel}
                className={`${baseClass} resize-none leading-relaxed`}
            />
        );
    }

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={baseClass}
        />
    );
}
