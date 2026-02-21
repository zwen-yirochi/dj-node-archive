import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { isEventEntry, isPublicEventEntry } from '@/types/domain';
import Link from 'next/link';

interface EntryCardProps {
    entry: ContentEntry;
    index: number;
    className?: string;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            })
            .toUpperCase();
    } catch {
        return dateStr;
    }
}

function getTitle(entry: ContentEntry): string {
    if (entry.type === 'event') return (entry as EventEntry).title;
    if (entry.type === 'mixset') return (entry as MixsetEntry).title;
    return (entry as LinkEntry).title;
}

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'event') return (entry as EventEntry).posterUrl;
    if (entry.type === 'mixset') return (entry as MixsetEntry).coverUrl;
    return undefined;
}

function DetailText({ entry }: { entry: ContentEntry }) {
    switch (entry.type) {
        case 'event': {
            const e = entry as EventEntry;
            if (!e.venue?.name) return <>{formatDate(e.date)}</>;
            const vcode = e.venue.id ? `VN-${e.venue.id.slice(0, 4).toUpperCase()}` : 'VN-0000';
            return (
                <>
                    @{' '}
                    <span className="border-b border-dotted border-dna-accent-blue text-dna-accent-blue">
                        {e.venue.name} [{vcode}]
                    </span>
                </>
            );
        }
        case 'mixset': {
            const m = entry as MixsetEntry;
            return (
                <>{m.durationMinutes ? `${m.durationMinutes}MIN` : formatDate(entry.createdAt)}</>
            );
        }
        case 'link': {
            const l = entry as LinkEntry;
            try {
                return <>{new URL(l.url).hostname}</>;
            } catch {
                return <>LINK</>;
            }
        }
    }
}

function getTypeLabel(type: string): string {
    if (type === 'event') return 'EVT';
    if (type === 'mixset') return 'MIX';
    return 'LNK';
}

function getDateValue(entry: ContentEntry): string {
    if (entry.type === 'event') return formatDate((entry as EventEntry).date);
    return formatDate(entry.createdAt);
}

export function EntryCard({ entry, index }: EntryCardProps) {
    const href =
        isEventEntry(entry) && isPublicEventEntry(entry) ? `/event/${entry.eventId}` : null;
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
                    <span className="border border-dna-ink-faint px-1 py-px text-dna-system uppercase tracking-dna-system text-dna-ink-light">
                        {typeLabel}
                    </span>
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
