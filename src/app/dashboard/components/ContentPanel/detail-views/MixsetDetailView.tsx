'use client';

import { useMemo } from 'react';

import type { TracklistItem } from '@/types';

import { FieldSync, IMAGE_FIELD_CONFIG, ImageField, TextField } from '../shared-fields';
import type { FieldSyncConfig } from '../shared-fields/FieldSync';
import KeyValueField, { type KeyValueColumn } from '../shared-fields/KeyValueField';
import LinkField from '../shared-fields/LinkField';
import type { ImageItem } from '../shared-fields/types';
import type { DetailViewProps, SaveOptions } from './types';
import { urlToStableId } from './utils';

// ============================================
// Field configs
// ============================================

const TEXT_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };
const URL_CONFIG: FieldSyncConfig<string> = { immediate: true };

const TRACKLIST_CONFIG: FieldSyncConfig<TracklistItem[]> = { debounceMs: 800 };

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

const EMPTY_TRACK: TracklistItem = { track: '', artist: '', time: '0:00' };

// ============================================
// MixsetDetailView
// ============================================

export default function MixsetDetailView({ entry, onSave, disabled }: DetailViewProps) {
    if (entry.type !== 'mixset') return null;

    const { title, imageUrls, url, tracklist, description } = entry;

    const imageItems: ImageItem[] = useMemo(
        () => imageUrls.map((u) => ({ id: urlToStableId(u), url: u })),
        [imageUrls]
    );

    const handleImageSave = (items: ImageItem[], options?: SaveOptions) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url),
            options
        );
    };

    return (
        <div className="space-y-8">
            {/* Title */}
            <FieldSync config={TEXT_CONFIG} value={title} onSave={(v) => onSave('title', v)}>
                {({ value, onChange }) => (
                    <TextField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder="Mixset title"
                        className="text-center text-xl font-bold text-dashboard-text"
                    />
                )}
            </FieldSync>

            {/* Cover image */}
            <FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                {({ value, onChange }) => (
                    <ImageField
                        value={value}
                        onChange={onChange}
                        aspectRatio="square"
                        maxCount={1}
                        disabled={disabled}
                    />
                )}
            </FieldSync>

            {/* URL */}
            <FieldSync config={URL_CONFIG} value={url || ''} onSave={(v) => onSave('url', v)}>
                {({ value, onChange }) => (
                    <LinkField value={value} onChange={onChange} disabled={disabled} />
                )}
            </FieldSync>

            {/* Description */}
            <div>
                <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                <FieldSync
                    config={TEXT_CONFIG}
                    value={description || ''}
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

            {/* Tracklist */}
            <div>
                <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Tracklist</h3>
                <FieldSync
                    config={TRACKLIST_CONFIG}
                    value={tracklist || []}
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
        </div>
    );
}
