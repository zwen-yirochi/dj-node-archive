'use client';

import { useMemo } from 'react';

import type { EventEntry, LinkEntry, MixsetEntry } from '@/types';
import { DETAIL_VIEW_CONFIG, type DetailFieldSlot } from '@/app/dashboard/config/detailViewConfig';

import {
    DATE_FIELD_CONFIG,
    DateField,
    FieldSync,
    ICON_FIELD_CONFIG,
    IconField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    KeyValueField,
    LINEUP_FIELD_CONFIG,
    LineupField,
    LinkField,
    TEXT_FIELD_CONFIG,
    TextField,
    TRACKLIST_FIELD_CONFIG,
    URL_FIELD_CONFIG,
    VENUE_FIELD_CONFIG,
    VenueField,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { DetailViewProps, SaveOptions } from './types';
import { urlToStableId } from './utils';

/** Entry types that UnifiedDetailView handles (excludes CustomEntry) */
type DetailEntry = EventEntry | MixsetEntry | LinkEntry;

// ============================================
// Image slot — separate component for useMemo (issue #1)
// ============================================

function ImageSlotRenderer({
    entry,
    slot,
    onSave,
    disabled,
}: {
    entry: DetailEntry;
    slot: Extract<DetailFieldSlot, { field: 'image' }>;
    onSave: DetailViewProps['onSave'];
    disabled?: boolean;
}) {
    const imageItems: ImageItem[] = useMemo(
        () => entry.imageUrls.map((url) => ({ id: urlToStableId(url), url })),
        [entry.imageUrls]
    );

    const handleImageSave = (items: ImageItem[], options?: SaveOptions) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url),
            options
        );
    };

    return (
        <FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
            {({ value, onChange }) => (
                <ImageField
                    value={value}
                    onChange={onChange}
                    aspectRatio={slot.aspectRatio}
                    maxCount={slot.maxCount}
                    disabled={disabled}
                />
            )}
        </FieldSync>
    );
}

// ============================================
// Field slot renderer
// ============================================

interface FieldRendererProps {
    slot: DetailFieldSlot;
    entry: DetailEntry;
    onSave: DetailViewProps['onSave'];
    disabled?: boolean;
}

function FieldSlotRenderer({ slot, entry, onSave, disabled }: FieldRendererProps) {
    switch (slot.field) {
        case 'title':
            return (
                <FieldSync
                    config={TEXT_FIELD_CONFIG}
                    value={entry.title}
                    onSave={(v) => onSave('title', v)}
                >
                    {({ value, onChange }) => (
                        <TextField
                            value={value}
                            onChange={onChange}
                            disabled={disabled}
                            placeholder={slot.placeholder}
                            className="text-center text-xl font-bold text-dashboard-text"
                        />
                    )}
                </FieldSync>
            );

        case 'image':
            return (
                <ImageSlotRenderer entry={entry} slot={slot} onSave={onSave} disabled={disabled} />
            );

        case 'date':
            if (entry.type !== 'event') return null;
            return (
                <FieldSync
                    config={DATE_FIELD_CONFIG}
                    value={entry.date}
                    onSave={(v) => onSave('date', v)}
                >
                    {({ value, onChange }) => (
                        <DateField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'venue':
            if (entry.type !== 'event') return null;
            return (
                <FieldSync
                    config={VENUE_FIELD_CONFIG}
                    value={entry.venue}
                    onSave={(v) => onSave('venue', v)}
                >
                    {({ value, onChange }) => (
                        <VenueField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'lineup':
            if (entry.type !== 'event') return null;
            return (
                <FieldSync
                    config={LINEUP_FIELD_CONFIG}
                    value={entry.lineup}
                    onSave={(v) => onSave('lineup', v)}
                >
                    {({ value, onChange }) => (
                        <LineupField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'url':
            if (entry.type !== 'mixset' && entry.type !== 'link') return null;
            return (
                <FieldSync
                    config={URL_FIELD_CONFIG}
                    value={entry.url || ''}
                    onSave={(v) => onSave('url', v)}
                >
                    {({ value, onChange }) => (
                        <LinkField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'icon':
            if (entry.type !== 'link') return null;
            return (
                <FieldSync
                    config={ICON_FIELD_CONFIG}
                    value={entry.icon || ''}
                    onSave={(v) => onSave('icon', v)}
                >
                    {({ value, onChange }) => (
                        <IconField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'description':
            return (
                <div>
                    <p className="mb-3 text-sm font-semibold text-dashboard-text">{slot.label}</p>
                    <FieldSync
                        config={TEXT_FIELD_CONFIG}
                        value={entry.description || ''}
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

        case 'tracklist':
            if (entry.type !== 'mixset') return null;
            return (
                <div>
                    <h3 className="mb-4 text-sm font-semibold text-dashboard-text">{slot.label}</h3>
                    <FieldSync
                        config={TRACKLIST_FIELD_CONFIG}
                        value={entry.tracklist || []}
                        onSave={(items) => onSave('tracklist', items)}
                    >
                        {({ value, onChange }) => (
                            <KeyValueField
                                value={value}
                                onChange={onChange}
                                disabled={disabled}
                                columns={slot.columns}
                                emptyItem={slot.emptyItem}
                                addLabel="Add track"
                            />
                        )}
                    </FieldSync>
                </div>
            );
    }
}

// ============================================
// UnifiedDetailView
// ============================================

export default function UnifiedDetailView({ entry, onSave, disabled }: DetailViewProps) {
    if (entry.type === 'custom') return null;

    const detailEntry = entry as DetailEntry;
    const slots = DETAIL_VIEW_CONFIG[detailEntry.type];

    return (
        <div className="space-y-8">
            {slots.map((slot) => (
                <FieldSlotRenderer
                    key={slot.field}
                    slot={slot}
                    entry={detailEntry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
