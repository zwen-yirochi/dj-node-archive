'use client';

import Image from 'next/image';

import { ImagePlus } from 'lucide-react';

import { Input } from '@/components/ui/input';

import type { ImageFieldProps } from './types';

const ASPECT_RATIO_CLASS: Record<string, string> = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

export default function ImageField({
    value,
    onChange,
    disabled,
    aspectRatio = 'video',
    placeholder,
}: ImageFieldProps) {
    const ratioClass = ASPECT_RATIO_CLASS[aspectRatio] ?? 'aspect-video';
    const PlaceholderIcon = placeholder?.icon ?? ImagePlus;
    const placeholderText = placeholder?.text ?? 'Enter image URL below';

    return (
        <div className="space-y-2">
            {value.url ? (
                <div className={`relative ${ratioClass} w-full overflow-hidden rounded-lg`}>
                    <Image
                        src={value.url}
                        alt={value.alt || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                </div>
            ) : (
                <div
                    className={`flex ${ratioClass} w-full items-center justify-center rounded-lg border-2 border-dashed border-dashboard-border`}
                >
                    <div className="text-center">
                        <PlaceholderIcon className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                        <p className="text-xs text-dashboard-text-muted">{placeholderText}</p>
                    </div>
                </div>
            )}
            <Input
                value={value.url}
                onChange={(e) => onChange({ ...value, url: e.target.value })}
                placeholder="Image URL"
                disabled={disabled}
                className="border-dashboard-border bg-dashboard-bg-muted text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder"
            />
            <Input
                value={value.caption || ''}
                onChange={(e) => onChange({ ...value, caption: e.target.value || undefined })}
                placeholder="Caption (optional)"
                disabled={disabled}
                className="border-none bg-transparent p-0 text-xs text-dashboard-text-muted placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />
        </div>
    );
}
