'use client';

import { useMemo } from 'react';

import type { EventEntry, LinkEntry, MixsetEntry } from '@/types';
import { DETAIL_VIEW_CONFIG, type DetailFieldSlot } from '@/app/dashboard/config/detailViewConfig';

import {
    DATE_FIELD_CONFIG,
    DateField,
    ICON_FIELD_CONFIG,
    IconField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    KeyValueField,
    LINEUP_FIELD_CONFIG,
    LineupField,
    LinkField,
    SyncedField,
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

    const handleImageSave = (items: ImageItem[]) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url)
        );
    };

    return (
        <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
            <ImageField
                aspectRatio={slot.aspectRatio}
                maxCount={slot.maxCount}
                disabled={disabled}
            />
        </SyncedField>
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
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={entry.title}
                    onSave={(v) => onSave('title', v)}
                >
                    <TextField
                        disabled={disabled}
                        placeholder={slot.placeholder}
                        className="text-center text-xl font-bold text-dashboard-text"
                    />
                </SyncedField>
            );

        case 'image':
            return (
                <ImageSlotRenderer entry={entry} slot={slot} onSave={onSave} disabled={disabled} />
            );

        case 'date':
            if (entry.type !== 'event') return null;
            return (
                <SyncedField
                    config={DATE_FIELD_CONFIG}
                    value={entry.date}
                    onSave={(v) => onSave('date', v)}
                >
                    <DateField disabled={disabled} />
                </SyncedField>
            );

        case 'venue':
            if (entry.type !== 'event') return null;
            return (
                <SyncedField
                    config={VENUE_FIELD_CONFIG}
                    value={entry.venue}
                    onSave={(v) => onSave('venue', v)}
                >
                    <VenueField disabled={disabled} />
                </SyncedField>
            );

        case 'lineup':
            if (entry.type !== 'event') return null;
            return (
                <SyncedField
                    config={LINEUP_FIELD_CONFIG}
                    value={entry.lineup}
                    onSave={(v) => onSave('lineup', v)}
                >
                    <LineupField disabled={disabled} />
                </SyncedField>
            );

        case 'url':
            if (entry.type !== 'mixset' && entry.type !== 'link') return null;
            return (
                <SyncedField
                    config={URL_FIELD_CONFIG}
                    value={entry.url || ''}
                    onSave={(v) => onSave('url', v)}
                >
                    <LinkField disabled={disabled} />
                </SyncedField>
            );

        case 'icon':
            if (entry.type !== 'link') return null;
            return (
                <SyncedField
                    config={ICON_FIELD_CONFIG}
                    value={entry.icon || ''}
                    onSave={(v) => onSave('icon', v)}
                >
                    <IconField disabled={disabled} />
                </SyncedField>
            );

        case 'description':
            return (
                <div>
                    <p className="mb-3 text-sm font-semibold text-dashboard-text">{slot.label}</p>
                    <SyncedField
                        config={TEXT_FIELD_CONFIG}
                        value={entry.description || ''}
                        onSave={(v) => onSave('description', v)}
                    >
                        <TextField
                            disabled={disabled}
                            variant="textarea"
                            placeholder="Add a description..."
                            className="text-sm leading-relaxed text-dashboard-text-muted"
                        />
                    </SyncedField>
                </div>
            );

        case 'tracklist':
            if (entry.type !== 'mixset') return null;
            return (
                <div>
                    <h3 className="mb-4 text-sm font-semibold text-dashboard-text">{slot.label}</h3>
                    <SyncedField
                        config={TRACKLIST_FIELD_CONFIG}
                        value={entry.tracklist || []}
                        onSave={(items) => onSave('tracklist', items)}
                    >
                        <KeyValueField
                            disabled={disabled}
                            columns={slot.columns}
                            emptyItem={slot.emptyItem}
                            addLabel="Add track"
                        />
                    </SyncedField>
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
