'use client';

import { ImageField } from '../shared-fields';
import type { ImageFieldValue } from '../shared-fields/types';
import type { SectionBlockEditorProps } from './types';

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    const handleChange = (value: ImageFieldValue) => {
        onChange({ url: value.url, alt: value.alt, caption: value.caption });
    };

    return <ImageField value={data} onChange={handleChange} disabled={disabled} />;
}
