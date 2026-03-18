// src/components/dna/entry-renderers/EntryFeatureCard.tsx

import Link from 'next/link';

import type { ContentEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';
import { TypeBadge } from '@/components/dna';
import { VenueLink } from '@/components/dna/VenueLink';

import { badgeMap, formatHostname, resolveHref } from './shared';

interface Props {
    entry: ContentEntry;
    username: string;
}

export function EntryFeatureCard({ entry, username }: Props) {
    const href = resolveHref(entry, entry.type === 'link' ? 'external' : 'detail', username);
    const image = entry.type !== 'custom' ? entry.imageUrls[0] : null;
    const badge = badgeMap[entry.type];

    const dateMeta =
        entry.type === 'event'
            ? formatDateCompact(entry.date)
            : entry.type === 'mixset' && entry.durationMinutes
              ? `${entry.durationMinutes}min`
              : null;

    const card = (
        <div className="border border-dna-ink-faint">
            <div className="aspect-video overflow-hidden bg-dna-bg-dark">
                {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-dna-label tracking-dna-system text-dna-ink-ghost">
                        {badge}
                    </div>
                )}
            </div>

            <div className="space-y-1.5 p-4">
                <div className="flex items-center gap-2">
                    <TypeBadge type={badge} className="px-1 py-px" />
                    {dateMeta && (
                        <span className="text-dna-label tracking-dna-system text-dna-ink-ghost">
                            {dateMeta}
                        </span>
                    )}
                </div>

                <h3 className="text-base font-semibold leading-snug">
                    {entry.title || 'Untitled'}
                </h3>

                {entry.type === 'event' && entry.venue?.name && (
                    <p className="text-xs text-dna-ink-light">
                        @ <VenueLink name={entry.venue.name} venueId={entry.venue.id} />
                    </p>
                )}
                {entry.type === 'event' && entry.lineup?.length > 0 && (
                    <p className="text-xs text-dna-ink-light">
                        {entry.lineup.map((a) => a.name).join(', ')}
                    </p>
                )}
                {entry.type === 'link' && (
                    <p className="truncate text-xs text-dna-ink-light">
                        {formatHostname(entry.url)}
                    </p>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block no-underline"
                {...(entry.type === 'link' ? { target: '_blank', rel: 'noopener' } : {})}
            >
                {card}
            </Link>
        );
    }
    return card;
}
