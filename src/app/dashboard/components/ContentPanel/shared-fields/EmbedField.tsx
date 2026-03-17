'use client';

import { useMemo } from 'react';

import { ExternalLink, Link2 } from 'lucide-react';

import { parseEmbedUrl } from '@/lib/embed';

import type { FieldComponentProps } from './types';

interface EmbedFieldProps extends FieldComponentProps<string> {
    placeholder?: string;
}

export default function EmbedField({
    value = '',
    onChange,
    disabled,
    placeholder = 'Paste URL (SoundCloud, YouTube, etc.)',
}: EmbedFieldProps) {
    const parsed = useMemo(() => parseEmbedUrl(value), [value]);

    return (
        <div className="space-y-2">
            {/* URL Input */}
            <div className="flex items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-3">
                <Link2 className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full border-none bg-transparent p-0 text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                />
            </div>

            {/* Preview */}
            {value && parsed && (
                <div className="overflow-hidden rounded-lg border border-dashboard-border">
                    <div className="flex items-center gap-1.5 border-b border-dashboard-border bg-dashboard-bg-muted px-3 py-1.5">
                        <span className="text-xs font-medium text-dashboard-text-secondary">
                            {parsed.displayName}
                        </span>
                    </div>
                    {'aspectRatio' in parsed.dimensions ? (
                        <div style={{ aspectRatio: parsed.dimensions.aspectRatio }}>
                            <iframe
                                src={parsed.embedUrl}
                                className="pointer-events-none h-full w-full"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={`${parsed.displayName} embed`}
                            />
                        </div>
                    ) : (
                        <iframe
                            src={parsed.embedUrl}
                            style={{ height: parsed.dimensions.height }}
                            className="pointer-events-none w-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={`${parsed.displayName} embed`}
                        />
                    )}
                </div>
            )}

            {/* Unsupported URL fallback — clickable link */}
            {value && !parsed && (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-dashboard-border px-3 py-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="truncate">{value}</span>
                </a>
            )}
        </div>
    );
}
