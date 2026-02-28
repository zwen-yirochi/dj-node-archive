'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

type HeaderStyle = 'minimal' | 'banner' | 'portrait' | 'shapes';

interface HeaderStyleOption {
    id: HeaderStyle;
    label: string;
}

const HEADER_STYLES: HeaderStyleOption[] = [
    { id: 'minimal', label: 'Minimal' },
    { id: 'banner', label: 'Banner' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'shapes', label: 'Shapes' },
];

export default function HeaderStyleSection() {
    const [selectedHeaderStyle, setSelectedHeaderStyle] = useState<HeaderStyle>('minimal');

    return (
        <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                Header
            </h3>

            {/* Style Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
                {HEADER_STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedHeaderStyle(style.id)}
                        className={cn(
                            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                            selectedHeaderStyle === style.id
                                ? 'border-dashboard-text bg-dashboard-text text-white'
                                : 'border-dashboard-border text-dashboard-text-secondary hover:border-dashboard-border-hover'
                        )}
                    >
                        {style.label}
                    </button>
                ))}
            </div>

            {/* Style Previews */}
            <div className="grid grid-cols-3 gap-3">
                {/* Minimal Preview */}
                <button
                    onClick={() => setSelectedHeaderStyle('minimal')}
                    className={cn(
                        'rounded-xl border-2 p-4 transition-all',
                        selectedHeaderStyle === 'minimal'
                            ? 'border-dashboard-text'
                            : 'border-dashboard-border hover:border-dashboard-border-hover'
                    )}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-dashboard-bg-active" />
                        <div className="h-2 w-12 rounded bg-dashboard-bg-active" />
                        <div className="flex gap-1">
                            <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                            <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                            <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                        </div>
                    </div>
                </button>

                {/* Banner Preview */}
                <button
                    onClick={() => setSelectedHeaderStyle('banner')}
                    className={cn(
                        'rounded-xl border-2 p-4 transition-all',
                        selectedHeaderStyle === 'banner'
                            ? 'border-dashboard-text'
                            : 'border-dashboard-border hover:border-dashboard-border-hover'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-dashboard-bg-active" />
                        <div className="flex flex-col gap-1">
                            <div className="h-2 w-10 rounded bg-dashboard-bg-active" />
                            <div className="flex gap-0.5">
                                <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                                <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                                <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                            </div>
                        </div>
                    </div>
                </button>

                {/* Portrait Preview */}
                <button
                    onClick={() => setSelectedHeaderStyle('portrait')}
                    className={cn(
                        'rounded-xl border-2 p-1 transition-all',
                        selectedHeaderStyle === 'portrait'
                            ? 'border-dashboard-text'
                            : 'border-dashboard-border hover:border-dashboard-border-hover'
                    )}
                >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-b from-dashboard-bg-active to-dashboard-bg-muted">
                        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
                            <div className="h-2 w-10 rounded bg-white/80" />
                            <div className="flex gap-0.5">
                                <div className="h-2 w-2 rounded-full bg-white/60" />
                                <div className="h-2 w-2 rounded-full bg-white/60" />
                                <div className="h-2 w-2 rounded-full bg-white/60" />
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </section>
    );
}
