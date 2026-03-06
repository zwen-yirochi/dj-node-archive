'use client';

import { useMemo } from 'react';

import type { ArtistReference, VenueReference } from '@/types';

import { FieldSync, IMAGE_FIELD_CONFIG, ImageField, TextField } from '../shared-fields';
import DateField from '../shared-fields/DateField';
import type { FieldSyncConfig } from '../shared-fields/FieldSync';
import LineupField from '../shared-fields/LineupField';
import type { ImageItem } from '../shared-fields/types';
import VenueField from '../shared-fields/VenueField';
import type { DetailViewProps, SaveOptions } from './types';
import { urlToStableId } from './utils';

// ============================================
// Field configs
// ============================================

const TEXT_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };
const DATE_CONFIG: FieldSyncConfig<string> = { immediate: true };
const VENUE_CONFIG: FieldSyncConfig<VenueReference> = { debounceMs: 800 };
const LINEUP_CONFIG: FieldSyncConfig<ArtistReference[]> = { immediate: true };

// ============================================
// EventDetailView
// ============================================

export default function EventDetailView({ entry, onSave, disabled }: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const { title, date, venue, imageUrls, description } = entry;

    const imageItems: ImageItem[] = useMemo(
        () => imageUrls.map((url) => ({ id: urlToStableId(url), url })),
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
                        placeholder="Event title"
                        className="text-center text-xl font-bold text-dashboard-text"
                    />
                )}
            </FieldSync>

            {/* Poster images */}
            <FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                {({ value, onChange }) => (
                    <ImageField
                        value={value}
                        onChange={onChange}
                        aspectRatio="portrait"
                        maxCount={10}
                        disabled={disabled}
                    />
                )}
            </FieldSync>

            {/* Date */}
            <FieldSync config={DATE_CONFIG} value={date} onSave={(v) => onSave('date', v)}>
                {({ value, onChange }) => (
                    <DateField value={value} onChange={onChange} disabled={disabled} />
                )}
            </FieldSync>

            {/* Venue */}
            <FieldSync config={VENUE_CONFIG} value={venue} onSave={(v) => onSave('venue', v)}>
                {({ value, onChange }) => (
                    <VenueField value={value} onChange={onChange} disabled={disabled} />
                )}
            </FieldSync>

            {/* Lineup */}
            <FieldSync
                config={LINEUP_CONFIG}
                value={entry.lineup}
                onSave={(v) => onSave('lineup', v)}
            >
                {({ value, onChange }) => (
                    <LineupField value={value} onChange={onChange} disabled={disabled} />
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
        </div>
    );
}
