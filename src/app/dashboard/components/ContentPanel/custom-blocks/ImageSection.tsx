'use client';

import { IMAGE_FIELD_CONFIG, ImageField, SyncedField } from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { SectionBlockEditorProps } from './types';

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    // 단일 ImageBlockData ↔ ImageItem[] 변환
    const imageItems: ImageItem[] = data.url ? [{ id: 'block-img', url: data.url }] : [];

    const handleSave = (items: ImageItem[]) => {
        onChange({ url: items[0]?.url || '' });
    };

    return (
        <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleSave}>
            <ImageField disabled={disabled} />
        </SyncedField>
    );
}
