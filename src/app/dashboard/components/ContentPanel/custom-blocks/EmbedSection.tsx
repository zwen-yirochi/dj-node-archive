'use client';

import { Link2 } from 'lucide-react';

import { Input } from '@/components/ui/input';

import type { SectionBlockEditorProps } from './types';

export default function EmbedSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'embed'>) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-3">
                <Link2 className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
                <Input
                    value={data.url}
                    onChange={(e) => onChange({ ...data, url: e.target.value })}
                    placeholder="Paste URL (SoundCloud, YouTube, etc.)"
                    disabled={disabled}
                    className="border-none bg-transparent p-0 text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
                />
            </div>
        </div>
    );
}
