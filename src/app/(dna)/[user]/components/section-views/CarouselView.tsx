'use client';

import Link from 'next/link';

import { isEventEntry, isPublicEventEntry, type ContentEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';
import { TypeBadge } from '@/components/dna';

interface CarouselViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
}

export function CarouselView({ entries }: CarouselViewProps) {
    const { scrollRef, state, scroll } = useHorizontalScroll();

    if (entries.length === 0) return null;

    return (
        <div>
            {/* Scroll container */}
            <div ref={scrollRef} className="scrollbar-hide flex gap-4 overflow-x-auto">
                {entries.map((entry) => (
                    <CarouselCard key={entry.id} entry={entry} />
                ))}
            </div>

            {/* Bottom bar: progress + nav */}
            {entries.length > 1 && (
                <div className="mt-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-dna-ink-faint">
                        <div
                            className="h-px bg-dna-ink-light transition-[width] duration-150"
                            style={{ width: `${Math.max(5, state.progress * 100)}%` }}
                        />
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!state.canScrollLeft}
                            className="border border-dna-ink-faint px-2 py-0.5 text-dna-system text-dna-ink-light transition-colors hover:bg-dna-bg-dark disabled:opacity-25"
                        >
                            &larr;
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!state.canScrollRight}
                            className="border border-dna-ink-faint px-2 py-0.5 text-dna-system text-dna-ink-light transition-colors hover:bg-dna-bg-dark disabled:opacity-25"
                        >
                            &rarr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Carousel Card ─────────────────────────────────────────────

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'custom') return undefined;
    return entry.imageUrls[0];
}

function getTypeLabel(type: string): 'EVT' | 'MIX' | 'LNK' {
    if (type === 'event') return 'EVT';
    if (type === 'mixset') return 'MIX';
    return 'LNK';
}

/** Fixed height for the image area */
const IMG_HEIGHT = 180;

function CarouselCard({ entry }: { entry: ContentEntry }) {
    const href =
        isEventEntry(entry) && isPublicEventEntry(entry) ? `/event/${entry.eventId}` : null;
    const imageUrl = getImageUrl(entry);
    const typeLabel = getTypeLabel(entry.type);
    const date =
        entry.type === 'event' ? formatDateCompact(entry.date) : formatDateCompact(entry.createdAt);

    const inner = (
        <div className="min-w-36 max-w-72 flex-shrink-0">
            {/* Image: fixed height, auto width from aspect ratio */}
            <div
                className="overflow-hidden border border-dna-ink-faint bg-dna-bg-dark"
                style={{ height: IMG_HEIGHT }}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-auto object-cover" />
                ) : (
                    <div
                        className="flex w-48 items-center justify-center text-dna-label tracking-dna-system text-dna-ink-ghost"
                        style={{ height: IMG_HEIGHT }}
                    >
                        {typeLabel}
                    </div>
                )}
            </div>
            {/* Meta */}
            <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-2">
                    <TypeBadge type={typeLabel} className="px-1 py-px" />
                    <span className="text-dna-label tracking-dna-system text-dna-ink-ghost">
                        {date}
                    </span>
                </div>
                <p className="max-w-48 truncate text-sm font-medium leading-snug">
                    {entry.title || 'Untitled'}
                </p>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block flex-shrink-0 no-underline">
                {inner}
            </Link>
        );
    }

    return inner;
}
