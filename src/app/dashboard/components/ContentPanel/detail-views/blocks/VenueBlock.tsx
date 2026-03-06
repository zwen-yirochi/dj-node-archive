'use client';

import { MapPin } from 'lucide-react';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import TextField from '../../shared-fields/TextField';
import type { FieldBlockProps } from '../types';

const VENUE_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function VenueBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const venue = entry.type === 'event' ? entry.venue : { name: '' };
    if (entry.type !== 'event') return null;

    return (
        <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <FieldSync
                config={VENUE_CONFIG}
                value={venue.name}
                onSave={(name) => onSave('venue', { ...venue, name })}
            >
                {({ value, onChange }) => (
                    <TextField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder="Enter venue name"
                    />
                )}
            </FieldSync>
        </div>
    );
}
