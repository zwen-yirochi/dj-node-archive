'use client';

import { useState } from 'react';

import { Timeline } from '@/components/dna/Timeline';

interface TimelineEntry {
    date: string;
    title: string;
    venue: string;
    link?: string;
}

interface EventStackGroupProps {
    stackTitle: string;
    eventCount: number;
    entries: TimelineEntry[];
}

export default function EventStackGroup({ stackTitle, eventCount, entries }: EventStackGroupProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-dashed border-dna-ink-faint last:border-b-0">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full cursor-pointer items-center gap-2 py-3 text-left font-mono-main hover:text-dna-accent-blue"
            >
                <span className="text-dna-meta-val text-dna-ink-light">
                    {isOpen ? '[-]' : '[+]'}
                </span>
                <span className="text-dna-item font-semibold">{stackTitle}</span>
                <span className="text-dna-meta-val text-dna-ink-light">({eventCount} events)</span>
            </button>

            {isOpen && (
                <div className="pb-2 pl-4">
                    <Timeline entries={entries} />
                </div>
            )}
        </div>
    );
}
