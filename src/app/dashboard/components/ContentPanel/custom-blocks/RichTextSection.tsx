'use client';

import { Textarea } from '@/components/ui/textarea';

import type { SectionBlockEditorProps } from './types';

export default function RichTextSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'richtext'>) {
    return (
        <Textarea
            value={data.content}
            onChange={(e) => onChange({ ...data, content: e.target.value })}
            placeholder="Write something..."
            disabled={disabled}
            rows={3}
            className="min-h-[80px] resize-none border-none bg-transparent p-0 text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
        />
    );
}
