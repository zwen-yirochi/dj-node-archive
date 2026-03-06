'use client';

import { EditFieldWrapper, IMAGE_FIELD_CONFIG, ImageField } from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { SectionBlockEditorProps } from './types';

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    // 단일 ImageBlockData ↔ ImageItem[] 변환
    const imageItems: ImageItem[] = data.url
        ? [{ id: 'block-img', url: data.url, alt: data.alt, caption: data.caption }]
        : [];

    const handleSave = (items: ImageItem[]) => {
        const first = items[0];
        onChange({ url: first?.url || '', alt: first?.alt, caption: first?.caption });
    };

    return (
        <EditFieldWrapper config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleSave}>
            {({ value, onChange: onFieldChange }) => (
                <ImageField value={value} onChange={onFieldChange} disabled={disabled} />
            )}
        </EditFieldWrapper>
    );
}
