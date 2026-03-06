'use client';

import { Link2 } from 'lucide-react';

import type { FieldComponentProps } from './types';

interface EmbedFieldProps extends FieldComponentProps<string> {
    placeholder?: string;
}

export default function EmbedField({
    value,
    onChange,
    disabled,
    placeholder = 'Paste URL (SoundCloud, YouTube, etc.)',
}: EmbedFieldProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-3">
                <Link2 className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full border-none bg-transparent p-0 text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                />
            </div>
        </div>
    );
}
