'use client';

import { useMemo } from 'react';

import { Calendar, MapPin, Users } from 'lucide-react';

import type { ArtistReference } from '@/types';

import {
    FieldSync,
    IMAGE_FIELD_CONFIG,
    ImageField,
    TagListField,
    TextField,
} from '../shared-fields';
import DateField from '../shared-fields/DateField';
import type { FieldSyncConfig } from '../shared-fields/FieldSync';
import type { TagItem } from '../shared-fields/TagListField';
import type { ImageItem } from '../shared-fields/types';
import type { DetailViewProps, SaveOptions } from './types';

/** URL → stable ID (short hash) */
function urlToStableId(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    return `poster-${(hash >>> 0).toString(36)}`;
}

// ============================================
// Field configs
// ============================================

const TEXT_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };
const DATE_CONFIG: FieldSyncConfig<string> = { immediate: true };
const TAG_CONFIG: FieldSyncConfig<TagItem[]> = { immediate: true };

const formatArtistTag = (name: string) => (name.startsWith('@') ? name : `@${name}`);

function toTagItems(artists: ArtistReference[]): TagItem[] {
    return artists.map(({ id, name }) => ({ id, name }));
}

function toArtistRefs(tags: TagItem[]): ArtistReference[] {
    return tags.map(({ id, name }) => ({ id, name }));
}

// ============================================
// EventDetailView
// ============================================

export default function EventDetailView({ entry, onSave, disabled }: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const { title, date, venue, posterUrls, description } = entry;

    // posterUrls ↔ ImageItem[] 변환 (URL 기반 안정 ID)
    const imageItems: ImageItem[] = useMemo(
        () => posterUrls.map((url) => ({ id: urlToStableId(url), url })),
        [posterUrls]
    );

    const handleImageSave = (items: ImageItem[], options?: SaveOptions) => {
        onSave(
            'posterUrls',
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

            {/* Info Grid — date, venue, lineup */}
            <div className="space-y-3">
                {/* Date */}
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <FieldSync config={DATE_CONFIG} value={date} onSave={(v) => onSave('date', v)}>
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

                {/* Venue */}
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <FieldSync
                        config={TEXT_CONFIG}
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

                {/* Lineup */}
                <div className="flex items-start gap-3 text-sm">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <FieldSync
                        config={TAG_CONFIG}
                        value={toTagItems(entry.lineup)}
                        onSave={(items) => onSave('lineup', toArtistRefs(items))}
                    >
                        {({ value, onChange }) => (
                            <TagListField
                                value={value}
                                onChange={onChange}
                                disabled={disabled}
                                placeholder="Tag artists with @username"
                                formatNewTag={formatArtistTag}
                            />
                        )}
                    </FieldSync>
                </div>
            </div>

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
