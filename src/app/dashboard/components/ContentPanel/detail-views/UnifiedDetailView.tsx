'use client';

import { useMemo } from 'react';

import type { ArtistReference, TracklistItem, VenueReference } from '@/types';
import { DETAIL_VIEW_CONFIG, type DetailFieldSlot } from '@/app/dashboard/config/detailViewConfig';

import { FieldSync, IMAGE_FIELD_CONFIG, ImageField, TextField } from '../shared-fields';
import DateField from '../shared-fields/DateField';
import type { FieldSyncConfig } from '../shared-fields/FieldSync';
import IconField from '../shared-fields/IconField';
import KeyValueField from '../shared-fields/KeyValueField';
import LineupField from '../shared-fields/LineupField';
import LinkField from '../shared-fields/LinkField';
import type { ImageItem } from '../shared-fields/types';
import VenueField from '../shared-fields/VenueField';
import type { DetailViewProps, SaveOptions } from './types';
import { urlToStableId } from './utils';

// ============================================
// Sync configs
// ============================================

const TEXT_DEBOUNCE: FieldSyncConfig<string> = { debounceMs: 800 };
const IMMEDIATE_STRING: FieldSyncConfig<string> = { immediate: true };
const VENUE_DEBOUNCE: FieldSyncConfig<VenueReference> = { debounceMs: 800 };
const LINEUP_IMMEDIATE: FieldSyncConfig<ArtistReference[]> = { immediate: true };
const TRACKLIST_DEBOUNCE: FieldSyncConfig<TracklistItem[]> = { debounceMs: 800 };

// ============================================
// Field renderer
// ============================================

interface FieldRendererProps {
    slot: DetailFieldSlot;
    entry: Record<string, unknown>;
    onSave: DetailViewProps['onSave'];
    disabled?: boolean;
}

function FieldSlotRenderer({ slot, entry, onSave, disabled }: FieldRendererProps) {
    // Image needs string[] → ImageItem[] conversion
    const imageUrls = (entry.imageUrls as string[]) || [];
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

    switch (slot.field) {
        case 'title':
            return (
                <FieldSync
                    config={TEXT_DEBOUNCE}
                    value={(entry.title as string) || ''}
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

        case 'date':
            return (
                <FieldSync
                    config={IMMEDIATE_STRING}
                    value={(entry.date as string) || ''}
                    onSave={(v) => onSave('date', v)}
                >
                    {({ value, onChange }) => (
                        <DateField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'venue':
            return (
                <FieldSync
                    config={VENUE_DEBOUNCE}
                    value={(entry.venue as VenueReference) || { name: '' }}
                    onSave={(v) => onSave('venue', v)}
                >
                    {({ value, onChange }) => (
                        <VenueField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'lineup':
            return (
                <FieldSync
                    config={LINEUP_IMMEDIATE}
                    value={(entry.lineup as ArtistReference[]) || []}
                    onSave={(v) => onSave('lineup', v)}
                >
                    {({ value, onChange }) => (
                        <LineupField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'url':
            return (
                <FieldSync
                    config={IMMEDIATE_STRING}
                    value={(entry.url as string) || ''}
                    onSave={(v) => onSave('url', v)}
                >
                    {({ value, onChange }) => (
                        <LinkField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>
            );

        case 'icon':
            return (
                <FieldSync
                    config={IMMEDIATE_STRING}
                    value={(entry.icon as string) || ''}
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
                    <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                    <FieldSync
                        config={TEXT_DEBOUNCE}
                        value={(entry.description as string) || ''}
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
            return (
                <div>
                    <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Tracklist</h3>
                    <FieldSync
                        config={TRACKLIST_DEBOUNCE}
                        value={(entry.tracklist as TracklistItem[]) || []}
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

    const slots = DETAIL_VIEW_CONFIG[entry.type];

    return (
        <div className="space-y-8">
            {slots.map((slot) => (
                <FieldSlotRenderer
                    key={slot.field}
                    slot={slot}
                    entry={entry as unknown as Record<string, unknown>}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
