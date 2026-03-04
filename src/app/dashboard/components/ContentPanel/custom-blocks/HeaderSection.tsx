'use client';

import { Input } from '@/components/ui/input';

import type { SectionBlockEditorProps } from './types';

export default function HeaderSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'header'>) {
    return (
        <div className="space-y-2">
            <Input
                value={data.title}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                placeholder="Heading"
                disabled={disabled}
                className="border-none bg-transparent p-0 text-lg font-bold text-dashboard-text placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />
            <Input
                value={data.subtitle || ''}
                onChange={(e) => onChange({ ...data, subtitle: e.target.value || undefined })}
                placeholder="Subtitle (optional)"
                disabled={disabled}
                className="border-none bg-transparent p-0 text-sm text-dashboard-text-secondary placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />
        </div>
    );
}
