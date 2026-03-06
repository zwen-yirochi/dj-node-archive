'use client';

import { useMemo } from 'react';

import { EVENT_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';

import { EditFieldWrapper, ImageField } from '../shared-fields';
import type { EditFieldConfig } from '../shared-fields/EditFieldWrapper';
import type { ImageItem } from '../shared-fields/types';
import { TitleEditModal } from './EditModals';
import type { DetailViewProps, SaveOptions } from './types';

const IMAGE_EDIT_CONFIG: EditFieldConfig<ImageItem[]> = {
    immediate: true,
};

/** URL → stable ID (short hash) */
function urlToStableId(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    return `poster-${(hash >>> 0).toString(36)}`;
}

// ============================================
// EventDetailView
// ============================================

export default function EventDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const posterUrls = entry.posterUrls;
    const title = entry.title;

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
            {/* Header — Image + title */}
            <div className="space-y-3">
                <div>
                    <EditFieldWrapper
                        config={IMAGE_EDIT_CONFIG}
                        value={imageItems}
                        onSave={handleImageSave}
                    >
                        {({ value, onChange }) => (
                            <ImageField
                                value={value}
                                onChange={onChange}
                                aspectRatio="portrait"
                                maxCount={10}
                                disabled={disabled}
                            />
                        )}
                    </EditFieldWrapper>
                </div>
                <h2 className="text-center text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* Info Grid — date, venue, lineup */}
            <div className="space-y-3">
                {EVENT_FIELD_BLOCKS.slice(0, 3).map((block) => (
                    <block.component
                        key={block.key}
                        entry={entry}
                        onSave={onSave}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Content blocks — description, links */}
            {EVENT_FIELD_BLOCKS.slice(3).map((block) => (
                <block.component
                    key={block.key}
                    entry={entry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}

            {/* Edit Modals */}
            {editingField === 'title' && (
                <TitleEditModal
                    value={title}
                    onSave={(newTitle) => {
                        onSave('title', newTitle);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
        </div>
    );
}
