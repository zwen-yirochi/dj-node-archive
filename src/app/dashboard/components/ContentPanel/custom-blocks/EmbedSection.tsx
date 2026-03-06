'use client';

import EmbedField from '../shared-fields/EmbedField';
import type { SectionBlockEditorProps } from './types';

export default function EmbedSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'embed'>) {
    return (
        <EmbedField
            value={data.url}
            onChange={(url) => onChange({ ...data, url })}
            disabled={disabled}
        />
    );
}
