'use client';

import { useMemo } from 'react';

import type { TracklistItem } from '@/types';

import {
    IMAGE_FIELD_CONFIG,
    ImageField,
    KeyValueField,
    LinkField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    TRACKLIST_FIELD_CONFIG,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { MixsetDetailViewProps } from './types';
import { urlToStableId } from './utils';

const TRACKLIST_COLUMNS = [
    {
        key: 'time',
        placeholder: '0:00',
        width: 'w-12 shrink-0',
        className: 'font-mono text-xs text-dashboard-text-placeholder',
    },
    { key: 'track', placeholder: 'Track title', width: 'min-w-0 flex-1' },
    {
        key: 'artist',
        placeholder: 'Artist',
        className: 'text-dashboard-text-placeholder',
    },
] as const;

const EMPTY_TRACK: TracklistItem = { track: '', artist: '', time: '0:00' };

export default function MixsetDetailView({ entry, onSave, disabled }: MixsetDetailViewProps) {
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
                    placeholder="Mixset title"
                    className="text-xl font-bold text-dashboard-text"
                />
            </SyncedField>

            <div className="pb-8">
                <SyncedField
                    config={IMAGE_FIELD_CONFIG}
                    value={imageItems}
                    onSave={handleImageSave}
                >
                    <ImageField disabled={disabled} maxCount={1} />
                </SyncedField>
            </div>

            <div className="mx-4 space-y-4">
                <div className="flex items-center gap-3">
                    <p className="w-16 shrink-0 text-sm font-semibold text-dashboard-text">URL</p>
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={URL_FIELD_CONFIG}
                            value={entry.url || ''}
                            onSave={(v) => onSave('url', v)}
                        >
                            <LinkField disabled={disabled} />
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

                <div className="pt-4">
                    <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Tracklist</h3>
                    <SyncedField
                        config={TRACKLIST_FIELD_CONFIG}
                        value={entry.tracklist || []}
                        onSave={(v) => onSave('tracklist', v)}
                        indicatorPosition="top-right"
                    >
                        <KeyValueField
                            disabled={disabled}
                            columns={[...TRACKLIST_COLUMNS]}
                            emptyItem={EMPTY_TRACK}
                            addLabel="Add track"
                        />
                    </SyncedField>
                </div>
            </div>
        </div>
    );
}
