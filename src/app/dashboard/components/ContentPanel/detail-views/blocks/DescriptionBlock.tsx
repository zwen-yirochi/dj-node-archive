'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import TextField from '../../shared-fields/TextField';
import type { FieldBlockProps } from '../types';

const DESC_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function DescriptionBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const description = 'description' in entry ? (entry.description as string) || '' : '';

    return (
        <div>
            <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
            <FieldSync
                config={DESC_CONFIG}
                value={description}
                onSave={(v) => onSave('description', v)}
            >
                {({ value, onChange }) => (
                    <TextField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        variant="textarea"
                        placeholder="Add a description..."
                        className="text-sm leading-relaxed text-dashboard-text-muted"
                    />
                )}
            </FieldSync>
        </div>
    );
}
