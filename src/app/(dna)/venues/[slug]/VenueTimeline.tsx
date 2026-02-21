'use client';

import { useState } from 'react';
import { Timeline } from '@/components/dna/Timeline';

interface TimelineEntry {
    date: string;
    title: string;
    venue: string;
    link?: string;
}

/** Number of events loaded per page (initial + each "more" click) */
const PAGE_SIZE = 5;

export default function VenueTimeline({ entries }: { entries: TimelineEntry[] }) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const visible = entries.slice(0, visibleCount);
    const remaining = entries.length - visibleCount;

    return (
        <>
            <Timeline entries={visible} />
            {remaining > 0 && (
                <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="mt-1 w-full cursor-pointer border border-dashed border-dna-ink-faint py-2.5 text-center font-mono-main text-dna-label uppercase tracking-dna-btn text-dna-ink-light hover:border-dna-ink-light hover:text-dna-ink"
                >
                    + {remaining} more events
                </button>
            )}
        </>
    );
}
