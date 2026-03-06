'use client';

import { useMemo } from 'react';

import { FieldSync, IMAGE_FIELD_CONFIG, ImageField, TextField } from '../shared-fields';
import type { FieldSyncConfig } from '../shared-fields/FieldSync';
import IconField from '../shared-fields/IconField';
import LinkField from '../shared-fields/LinkField';
import type { ImageItem } from '../shared-fields/types';
import type { DetailViewProps, SaveOptions } from './types';
import { urlToStableId } from './utils';

// ============================================
// Field configs
// ============================================

const TEXT_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };
const URL_CONFIG: FieldSyncConfig<string> = { immediate: true };
const ICON_CONFIG: FieldSyncConfig<string> = { immediate: true };

// ============================================
// LinkDetailView
// ============================================

export default function LinkDetailView({ entry, onSave, disabled }: DetailViewProps) {
    if (entry.type !== 'link') return null;

    const { title, url, imageUrls, icon, description } = entry;

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
            {/* Header — Icon + title */}
            <div className="space-y-3 text-center">
                <FieldSync
                    config={ICON_CONFIG}
                    value={icon || ''}
                    onSave={(v) => onSave('icon', v)}
                >
                    {({ value, onChange }) => (
                        <IconField value={value} onChange={onChange} disabled={disabled} />
                    )}
                </FieldSync>

                <FieldSync config={TEXT_CONFIG} value={title} onSave={(v) => onSave('title', v)}>
                    {({ value, onChange }) => (
                        <TextField
                            value={value}
                            onChange={onChange}
                            disabled={disabled}
                            placeholder="Link title"
                            className="text-center text-xl font-bold text-dashboard-text"
                        />
                    )}
                </FieldSync>
            </div>

            {/* Cover image */}
            <FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                {({ value, onChange }) => (
                    <ImageField
                        value={value}
                        onChange={onChange}
                        aspectRatio="video"
                        maxCount={1}
                        disabled={disabled}
                    />
                )}
            </FieldSync>

            {/* URL */}
            <FieldSync config={URL_CONFIG} value={url} onSave={(v) => onSave('url', v)}>
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
        </div>
    );
}
