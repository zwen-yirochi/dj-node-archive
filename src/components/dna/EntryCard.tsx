import Link from 'next/link';

import type { ContentEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';
import { getEntryHref } from '@/lib/utils/entry-link';

import { TypeBadge } from './TypeBadge';
import { VenueLink } from './VenueLink';

interface EntryCardProps {
    entry: ContentEntry;
    index: number;
    username: string;
    className?: string;
}

function getTitle(entry: ContentEntry): string {
    return entry.title;
}

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'custom') return undefined;
    return entry.imageUrls[0];
}

function DetailText({ entry }: { entry: ContentEntry }) {
    switch (entry.type) {
        case 'event': {
            if (!entry.venue?.name) return <>{formatDateCompact(entry.date)}</>;
            return (
                <>
                    @ <VenueLink name={entry.venue.name} venueId={entry.venue.id} />
                </>
            );
        }
        case 'mixset':
            return (
                <>
                    {entry.durationMinutes
                        ? `${entry.durationMinutes}MIN`
                        : formatDateCompact(entry.createdAt)}
                </>
            );
        case 'link':
            try {
                return <>{new URL(entry.url).hostname}</>;
            } catch {
                return <>LINK</>;
            }
    }
}

function getTypeLabel(type: string): string {
    if (type === 'event') return 'EVT';
    if (type === 'mixset') return 'MIX';
    return 'LNK';
}

function getDateValue(entry: ContentEntry): string {
    if (entry.type === 'event') return formatDateCompact(entry.date);
    return formatDateCompact(entry.createdAt);
}

export function EntryCard({ entry, index, username }: EntryCardProps) {
    const href = getEntryHref(entry, username);
    const typeLabel = getTypeLabel(entry.type);
    const imageUrl = getImageUrl(entry);

    const card = (
        <div className="dna-border-row flex gap-4 border-b py-4 last:border-b-0">
            {/* Thumbnail */}
            <div className="h-[80px] w-[64px] flex-shrink-0 overflow-hidden border border-dna-ink-faint bg-dna-bg-dark md:h-[90px] md:w-[70px]">
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="dna-text-system flex h-full w-full items-center justify-center">
                        {typeLabel}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                        {getTitle(entry)}
                    </span>
                    {/* Desktop: 날짜 */}
                    <span className="hidden whitespace-nowrap text-dna-label tracking-dna-system text-dna-ink-ghost md:inline">
                        {getDateValue(entry)}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={typeLabel as 'EVT' | 'MIX' | 'LNK'} className="px-1 py-px" />
                    <span className="text-xs tracking-dna-input text-dna-ink-light">
                        <DetailText entry={entry} />
                    </span>
                </div>
                {/* Mobile: 날짜 */}
                <span className="text-dna-label tracking-dna-system text-dna-ink-ghost md:hidden">
                    {getDateValue(entry)}
                </span>
            </div>

            {/* Arrow */}
            {href && (
                <div className="flex items-center">
                    <span className="text-sm text-dna-ink-ghost">&rarr;</span>
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="group block no-underline">
                {card}
            </Link>
        );
    }

    return card;
}
