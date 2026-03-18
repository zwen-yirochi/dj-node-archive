// src/components/dna/entry-renderers/EntryCarouselCard.tsx

import Link from 'next/link';

import type { ContentEntry } from '@/types/domain';
import { TypeBadge } from '@/components/dna';

import { carouselCardConfig } from './entry-carousel-card.config';
import { resolveHref } from './shared';

const IMG_HEIGHT = 180;

interface Props {
    entry: ContentEntry;
    username: string;
}

export function EntryCarouselCard({ entry, username }: Props) {
    const spec = carouselCardConfig[entry.type];
    const image = spec.getImage?.(entry as never) ?? null;
    const date = spec.getDate?.(entry as never) ?? null;
    const subtitle = spec.getSubtitle?.(entry as never) ?? null;
    const href = resolveHref(entry, spec.linkTarget, username);

    const card = (
        <div className="min-w-36 max-w-72 flex-shrink-0">
            <div
                className="overflow-hidden border border-dna-ink-faint bg-dna-bg-dark"
                style={{ height: IMG_HEIGHT }}
            >
                {image ? (
                    <img src={image} alt="" className="h-full w-auto object-cover" />
                ) : (
                    <div
                        className="flex w-48 items-center justify-center text-dna-label tracking-dna-system text-dna-ink-ghost"
                        style={{ height: IMG_HEIGHT }}
                    >
                        {spec.badge}
                    </div>
                )}
            </div>
            <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-2">
                    <TypeBadge type={spec.badge} className="px-1 py-px" />
                    {date && (
                        <span className="text-dna-label tracking-dna-system text-dna-ink-ghost">
                            {date}
                        </span>
                    )}
                </div>
                <p className="max-w-48 truncate text-sm font-medium leading-snug">
                    {entry.title || 'Untitled'}
                </p>
                {subtitle && (
                    <p className="truncate text-xs tracking-dna-input text-dna-ink-light">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block flex-shrink-0 no-underline"
                {...(spec.linkTarget === 'external' ? { target: '_blank', rel: 'noopener' } : {})}
            >
                {card}
            </Link>
        );
    }

    return card;
}
