import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { isEventEntry, isPublicEventEntry } from '@/types/domain';
import Link from 'next/link';

interface Props {
    entry: ContentEntry;
    index: number;
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

function getDetail(entry: ContentEntry): string {
    switch (entry.type) {
        case 'event': {
            const e = entry as EventEntry;
            return e.venue?.name ? `@ ${e.venue.name}` : formatDate(e.date);
        }
        case 'mixset': {
            const m = entry as MixsetEntry;
            return m.durationMinutes ? `${m.durationMinutes}MIN` : formatDate(entry.createdAt);
        }
        case 'link': {
            const l = entry as LinkEntry;
            try {
                return new URL(l.url).hostname;
            } catch {
                return 'LINK';
            }
        }
    }
}

function getTypeLabel(type: string): 'EVT' | 'VEN' | 'ART' {
    if (type === 'event') return 'EVT';
    return 'ART'; // mixset and link use ART as closest match
}

function getDateValue(entry: ContentEntry): string {
    if (entry.type === 'event') return formatDate((entry as EventEntry).date);
    return formatDate(entry.createdAt);
}

export default function EntryCard({ entry, index }: Props) {
    const href =
        isEventEntry(entry) && isPublicEventEntry(entry) ? `/event/${entry.eventId}` : null;
    const typeLabel = getTypeLabel(entry.type);

    const card = (
        <div className="flex items-center gap-3 border-b border-dotted border-cortex-ink-faint py-2.5 last:border-b-0">
            <span className="min-w-[24px] text-cortex-label text-cortex-ink-ghost">
                {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-[32px] border border-cortex-ink-faint px-[5px] py-0.5 text-center text-[7px] uppercase tracking-cortex-system text-cortex-ink-light">
                {typeLabel}
            </span>
            <span className="min-w-0 flex-1 truncate text-cortex-body font-medium">
                {getTitle(entry)}
            </span>
            <span className="text-cortex-label tracking-[0.5px] text-cortex-ink-light">
                {getDetail(entry)}
            </span>
            <span className="whitespace-nowrap text-cortex-system tracking-cortex-system text-cortex-ink-ghost">
                {getDateValue(entry)}
            </span>
            {href && <span className="text-cortex-meta-val text-cortex-ink-ghost">&rarr;</span>}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="group block no-underline hover:underline">
                {card}
            </Link>
        );
    }

    return card;
}
