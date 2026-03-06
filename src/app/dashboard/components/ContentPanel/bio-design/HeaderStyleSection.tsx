'use client';

import type { HeaderStyle } from '@/types/domain';
import { cn } from '@/lib/utils';

import { headerStyles } from './header-style.config';

interface HeaderStyleSectionProps {
    headerStyle: HeaderStyle;
    onChangeHeaderStyle: (style: HeaderStyle) => void;
}

export default function HeaderStyleSection({
    headerStyle,
    onChangeHeaderStyle,
}: HeaderStyleSectionProps) {
    return (
        <section>
            <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Header</h3>

            {/* Style Cards */}
            <div className="grid grid-cols-2 gap-3">
                {headerStyles.map((style) => (
                    <button
                        key={style.key}
                        onClick={() => onChangeHeaderStyle(style.key)}
                        className={cn(
                            'rounded-xl border-2 p-3 text-left transition-all',
                            headerStyle === style.key
                                ? 'border-dashboard-text'
                                : 'border-dashboard-border hover:border-dashboard-border-hover'
                        )}
                    >
                        <StylePreview styleKey={style.key} />
                        <p className="mt-2 text-xs font-medium text-dashboard-text">
                            {style.label}
                        </p>
                    </button>
                ))}
            </div>
        </section>
    );
}

function StylePreview({ styleKey }: { styleKey: HeaderStyle }) {
    switch (styleKey) {
        case 'minimal':
            return (
                <div className="flex flex-col items-center gap-2 py-2">
                    <div className="h-10 w-10 rounded-full bg-dashboard-bg-active" />
                    <div className="h-2 w-14 rounded bg-dashboard-bg-active" />
                    <div className="h-1.5 w-20 rounded bg-dashboard-bg-hover" />
                    <div className="flex gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-dashboard-bg-active" />
                        <div className="h-2.5 w-2.5 rounded-full bg-dashboard-bg-active" />
                        <div className="h-2.5 w-2.5 rounded-full bg-dashboard-bg-active" />
                    </div>
                </div>
            );
        case 'banner':
            return (
                <div className="flex flex-col gap-2">
                    <div className="h-10 rounded bg-gradient-to-r from-dashboard-bg-active to-dashboard-bg-hover" />
                    <div className="-mt-4 ml-3 flex items-end gap-2">
                        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-dashboard-bg-surface bg-dashboard-bg-active" />
                        <div className="flex flex-col gap-1 pb-1">
                            <div className="h-1.5 w-10 rounded bg-dashboard-bg-active" />
                            <div className="h-1 w-14 rounded bg-dashboard-bg-hover" />
                        </div>
                    </div>
                </div>
            );
        case 'portrait':
            return (
                <div className="flex flex-col items-center gap-2 py-1">
                    <div className="relative aspect-[4/5] w-14 overflow-hidden rounded-sm bg-gradient-to-b from-dashboard-bg-active to-dashboard-bg-muted">
                        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center gap-0.5">
                            <div className="h-1 w-8 rounded bg-white/70" />
                            <div className="h-0.5 w-5 rounded bg-white/40" />
                        </div>
                    </div>
                    <div className="h-2 w-12 rounded bg-dashboard-bg-active" />
                </div>
            );
        case 'shapes':
            return (
                <div className="relative flex items-center gap-2 rounded border border-dashed border-dashboard-border-hover bg-dashboard-bg-hover/30 p-3">
                    <div className="absolute right-2 top-2 h-5 w-5 rotate-45 border border-dashboard-border-hover" />
                    <div className="absolute bottom-2 right-5 h-3 w-3 rounded-full border border-dashed border-dashboard-border-hover" />
                    <div className="h-8 w-8 shrink-0 rounded-sm bg-dashboard-bg-active" />
                    <div className="flex flex-col gap-1">
                        <div className="h-1.5 w-10 rounded bg-dashboard-bg-active" />
                        <div className="h-1 w-16 rounded bg-dashboard-bg-hover" />
                    </div>
                </div>
            );
    }
}
