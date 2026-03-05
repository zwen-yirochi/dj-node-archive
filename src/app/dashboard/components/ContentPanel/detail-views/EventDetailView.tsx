'use client';

import { EVENT_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';
import { useImmediateSave } from '@/app/dashboard/hooks/use-immediate-save';

import { EditFieldWrapper, ImageField } from '../shared-fields';
import type { EditFieldConfig } from '../shared-fields/EditFieldWrapper';
import type { ImageFieldValue } from '../shared-fields/types';
import { ImageEditModal, TitleEditModal } from './EditModals';
import type { DetailViewProps } from './types';

const IMAGE_EDIT_CONFIG: EditFieldConfig<ImageFieldValue> = {
    useSave: useImmediateSave,
};

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

    const posterUrl = entry.posterUrl;
    const title = entry.title;

    const imageValue: ImageFieldValue = { url: posterUrl || '' };

    const handleImageSave = (value: ImageFieldValue) => {
        onSave('posterUrl', value.url);
    };

    return (
        <div className="space-y-8">
            {/* Header — Image + title */}
            <div className="space-y-3">
                <div className="mx-auto max-w-[200px]">
                    <EditFieldWrapper
                        config={IMAGE_EDIT_CONFIG}
                        value={imageValue}
                        onSave={handleImageSave}
                    >
                        {({ value, onChange }) => (
                            <ImageField
                                value={value}
                                onChange={onChange}
                                aspectRatio="portrait"
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

            {/* Edit Modals — Triggered from "..." menu */}
            {editingField === 'image' && (
                <ImageEditModal
                    value={posterUrl || ''}
                    onSave={(url) => {
                        onSave('posterUrl', url);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
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
