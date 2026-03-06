'use client';

import { useMemo } from 'react';

import {
    DATE_FIELD_CONFIG,
    DateField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    LINEUP_FIELD_CONFIG,
    LineupField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    VENUE_FIELD_CONFIG,
    VenueField,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { EventDetailViewProps } from './types';
import { urlToStableId } from './utils';

export default function EventDetailView({ entry, onSave, disabled }: EventDetailViewProps) {
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
        <div className="space-y-8 px-6">
            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={entry.title}
                onSave={(v) => onSave('title', v)}
            >
                <TextField
                    disabled={disabled}
                    placeholder="Event title"
                    className="text-xl font-bold text-dashboard-text"
                />
            </SyncedField>
            <div className="pb-8">
                <SyncedField
                    config={IMAGE_FIELD_CONFIG}
                    value={imageItems}
                    onSave={handleImageSave}
                >
                    <ImageField disabled={disabled} aspectRatio="portrait" maxCount={10} />
                </SyncedField>
            </div>
            <div className="mx-4 space-y-4">
                <div className="flex items-center gap-3">
                    <p className="w-16 shrink-0 text-sm font-semibold text-dashboard-text">Venue</p>
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={VENUE_FIELD_CONFIG}
                            value={entry.venue}
                            onSave={(v) => onSave('venue', v)}
                        >
                            <VenueField disabled={disabled} />
                        </SyncedField>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <p className="w-16 shrink-0 text-sm font-semibold text-dashboard-text">
                        Lineup
                    </p>
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={LINEUP_FIELD_CONFIG}
                            value={entry.lineup}
                            onSave={(v) => onSave('lineup', v)}
                        >
                            <LineupField disabled={disabled} />
                        </SyncedField>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <p className="w-16 shrink-0 pt-1.5 text-sm font-semibold text-dashboard-text">
                        Date
                    </p>
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={DATE_FIELD_CONFIG}
                            value={entry.date}
                            onSave={(v) => onSave('date', v)}
                        >
                            <DateField disabled={disabled} />
                        </SyncedField>
                    </div>
                </div>
                <div className="pt-8">
                    <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
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
            </div>
        </div>
    );
}
