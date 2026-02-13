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

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'event') return (entry as EventEntry).posterUrl;
    if (entry.type === 'mixset') return (entry as MixsetEntry).coverUrl;
    return undefined;
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

function getTypeLabel(type: string): string {
    if (type === 'event') return 'EVT';
    if (type === 'mixset') return 'MIX';
    return 'LNK';
}

function getDateValue(entry: ContentEntry): string {
    if (entry.type === 'event') return formatDate((entry as EventEntry).date);
    return formatDate(entry.createdAt);
}

export default function EntryCard({ entry, index }: Props) {
    const href =
        isEventEntry(entry) && isPublicEventEntry(entry) ? `/event/${entry.eventId}` : null;
    const typeLabel = getTypeLabel(entry.type);
    const imageUrl = getImageUrl(entry);

    const card = (
        <div className="flex gap-3 border-b border-dotted border-cortex-ink-faint py-3 last:border-b-0">
            {/* Thumbnail — 모바일에서도 표시 */}
            <div className="h-[60px] w-[48px] flex-shrink-0 overflow-hidden border border-cortex-ink-faint bg-cortex-bg-dark md:h-[72px] md:w-[56px]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover contrast-[1.1] grayscale-[70%]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] uppercase tracking-cortex-system text-cortex-ink-ghost">
                        {typeLabel}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
                {/* Mobile: 타이틀 + 메타 세로 스택 */}
                <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-cortex-body font-medium">
                        {getTitle(entry)}
                    </span>
                    {/* Desktop only: 날짜 */}
                    <span className="hidden whitespace-nowrap text-cortex-system tracking-cortex-system text-cortex-ink-ghost md:inline">
                        {getDateValue(entry)}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <span className="border border-cortex-ink-faint px-[4px] py-px text-[7px] uppercase tracking-cortex-system text-cortex-ink-light">
                        {typeLabel}
                    </span>
                    <span className="text-cortex-label tracking-[0.5px] text-cortex-ink-light">
                        {getDetail(entry)}
                    </span>
                    {/* Mobile only: 날짜 */}
                    <span className="text-cortex-system tracking-cortex-system text-cortex-ink-ghost md:hidden">
                        {getDateValue(entry)}
                    </span>
                </div>
            </div>

            {/* Arrow */}
            {href && (
                <div className="flex items-center">
                    <span className="text-cortex-meta-val text-cortex-ink-ghost">&rarr;</span>
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
