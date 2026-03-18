'use client';

import type { ContentEntry } from '@/types/domain';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';
import { EntryCarouselCard } from '@/components/dna/entry-renderers/EntryCarouselCard';

interface CarouselViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

export function CarouselView({ entries, username }: CarouselViewProps) {
    const { scrollRef, state, scroll } = useHorizontalScroll();

    if (entries.length === 0) return null;

    return (
        <div>
            {/* Scroll container */}
            <div ref={scrollRef} className="scrollbar-hide flex gap-4 overflow-x-auto">
                {entries.map((entry) => (
                    <EntryCarouselCard key={entry.id} entry={entry} username={username} />
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
