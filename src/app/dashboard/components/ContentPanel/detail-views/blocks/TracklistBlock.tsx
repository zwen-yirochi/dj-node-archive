'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import KeyValueField, { type KeyValueColumn } from '../../shared-fields/KeyValueField';
import type { FieldBlockProps } from '../types';

type TrackItem = { track: string; artist: string; time: string };

const TRACKLIST_CONFIG: FieldSyncConfig<TrackItem[]> = { immediate: true };

const TRACKLIST_COLUMNS: KeyValueColumn[] = [
    {
        key: 'time',
        placeholder: '0:00',
        width: 'w-12 shrink-0',
        className: 'font-mono text-xs text-dashboard-text-placeholder',
    },
    { key: 'track', placeholder: 'Track title', width: 'min-w-0 flex-1' },
    { key: 'artist', placeholder: 'Artist', className: 'text-dashboard-text-placeholder' },
];

const EMPTY_TRACK: TrackItem = { track: '', artist: '', time: '0:00' };

export default function TracklistBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const tracklist: TrackItem[] = entry.type === 'mixset' ? entry.tracklist || [] : [];

    return (
        <div>
            <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Tracklist</h3>
            <FieldSync
                config={TRACKLIST_CONFIG}
                value={tracklist}
                onSave={(items) => onSave('tracklist', items)}
            >
                {({ value, onChange }) => (
                    <KeyValueField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        columns={TRACKLIST_COLUMNS}
                        emptyItem={EMPTY_TRACK}
                        addLabel="Add track"
                    />
                )}
            </FieldSync>
        </div>
    );
}
