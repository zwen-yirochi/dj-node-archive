'use client';

import { Calendar } from 'lucide-react';

import { FieldSync } from '../../shared-fields';
import DateField from '../../shared-fields/DateField';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import type { FieldBlockProps } from '../types';

const DATE_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function DateBlock({ entry, onSave, disabled }: FieldBlockProps) {
    if (entry.type !== 'event') return null;

    return (
        <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <FieldSync config={DATE_CONFIG} value={entry.date} onSave={(v) => onSave('date', v)}>
                {({ value, onChange }) => (
                    <DateField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className="flex-1"
                    />
                )}
            </FieldSync>
        </div>
    );
}
