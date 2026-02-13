'use client';

import { useState } from 'react';
import { Timeline } from '@/components/cortex/Timeline';

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
                    className="mt-1 w-full cursor-pointer border border-dashed border-cortex-ink-faint py-2.5 text-center font-mono-main text-cortex-label uppercase tracking-cortex-btn text-cortex-ink-light hover:border-cortex-ink-light hover:text-cortex-ink"
                >
                    + {remaining} more events
                </button>
            )}
        </>
    );
}
