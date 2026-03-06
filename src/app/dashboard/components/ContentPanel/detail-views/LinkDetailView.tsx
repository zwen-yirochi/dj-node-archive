'use client';

import { useMemo } from 'react';

import type { LinkEntry } from '@/types';

import {
    ICON_FIELD_CONFIG,
    IconField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    LinkField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { LinkDetailViewProps } from './types';
import { urlToStableId } from './utils';

export default function LinkDetailView({ entry, onSave, disabled }: LinkDetailViewProps) {
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
        <div className="space-y-8">
            <SyncedField
                config={ICON_FIELD_CONFIG}
                value={entry.icon || ''}
                onSave={(v) => onSave('icon', v)}
            >
                <IconField disabled={disabled} />
            </SyncedField>

            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={entry.title}
                onSave={(v) => onSave('title', v)}
            >
                <TextField
                    disabled={disabled}
                    placeholder="Link title"
                    className="text-center text-xl font-bold text-dashboard-text"
                />
            </SyncedField>

            <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                <ImageField disabled={disabled} aspectRatio="video" maxCount={1} />
            </SyncedField>

            <SyncedField
                config={URL_FIELD_CONFIG}
                value={entry.url || ''}
                onSave={(v) => onSave('url', v)}
            >
                <LinkField disabled={disabled} />
            </SyncedField>

            <div>
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
    );
}
