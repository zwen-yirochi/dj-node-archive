'use client';

import Image from 'next/image';

import { ImagePlus } from 'lucide-react';

import { Input } from '@/components/ui/input';

import type { SectionBlockEditorProps } from './types';

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    return (
        <div className="space-y-2">
            {data.url ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                        src={data.url}
                        alt={data.alt || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                </div>
            ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-dashboard-border">
                    <div className="text-center">
                        <ImagePlus className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                        <p className="text-xs text-dashboard-text-muted">Enter image URL below</p>
                    </div>
                </div>
            )}
            <Input
                value={data.url}
                onChange={(e) => onChange({ ...data, url: e.target.value })}
                placeholder="Image URL"
                disabled={disabled}
                className="border-dashboard-border bg-dashboard-bg-muted text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder"
            />
            <Input
                value={data.caption || ''}
                onChange={(e) => onChange({ ...data, caption: e.target.value || undefined })}
                placeholder="Caption (optional)"
                disabled={disabled}
                className="border-none bg-transparent p-0 text-xs text-dashboard-text-muted placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />
        </div>
    );
}
