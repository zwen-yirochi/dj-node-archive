'use client';

import TextField from '../shared-fields/TextField';
import type { SectionBlockEditorProps } from './types';

export default function RichTextSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'richtext'>) {
    return (
        <TextField
            value={data.content}
            onChange={(content) => onChange({ ...data, content })}
            disabled={disabled}
            variant="textarea"
            placeholder="Write something..."
            rows={3}
            className="min-h-[80px] text-sm text-dashboard-text"
        />
    );
}
