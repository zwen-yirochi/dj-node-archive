'use client';

import { EditFieldWrapper, ImageField } from '../shared-fields';
import type { EditFieldConfig } from '../shared-fields/EditFieldWrapper';
import type { ImageItem } from '../shared-fields/types';
import type { SectionBlockEditorProps } from './types';

const IMAGE_EDIT_CONFIG: EditFieldConfig<ImageItem[]> = {
    immediate: true,
};

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
        <EditFieldWrapper config={IMAGE_EDIT_CONFIG} value={imageItems} onSave={handleSave}>
            {({ value, onChange: onFieldChange }) => (
                <ImageField value={value} onChange={onFieldChange} disabled={disabled} />
            )}
        </EditFieldWrapper>
    );
}
