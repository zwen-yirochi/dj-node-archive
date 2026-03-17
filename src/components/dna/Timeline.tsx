import Link from 'next/link';

import { cn } from '@/lib/utils';
import { LineupText, type LineupArtist } from '@/components/dna/LineupText';

export interface TimelineEntry {
    date: string;
    title: string;
    venue: string;
    link?: string;
    imageUrl?: string;
    stackLabel?: string;
    stackLink?: string;
    artists?: LineupArtist[];
}

interface TimelineProps {
    entries: TimelineEntry[];
    className?: string;
}

export function Timeline({ entries, className }: TimelineProps) {
    return (
        <div className={cn('relative my-3 pl-6', className)}>
            {/* Vertical dashed line */}
            <div className="dna-border-structure absolute bottom-1 left-1 top-1 w-0 border-l" />

            {entries.map((entry, i) => (
                <div key={i} className="relative py-2 pb-4">
                    {/* Marker */}
                    <span
                        className={cn(
                            'absolute -left-6 top-2 w-[9px] text-center text-dna-meta-val',
                            i === 0 ? 'font-bold text-dna-ink' : 'text-dna-ink-light'
                        )}
                    >
                        {i === 0 ? '*' : '+'}
                    </span>

                    <div className="flex gap-3">
                        {entry.imageUrl && (
                            <div className="h-[50px] w-[40px] flex-shrink-0 overflow-hidden border border-dna-ink-faint bg-dna-bg-dark">
                                <img
                                    src={entry.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="dna-text-meta">{entry.date}</div>
                            <div className="my-0.5 text-dna-item font-semibold">
                                {entry.link ? (
                                    <Link href={entry.link} className="text-inherit no-underline">
                                        {entry.title}
                                    </Link>
                                ) : (
                                    entry.title
                                )}
                            </div>
                            {entry.stackLabel && entry.stackLink && (
                                <div className="text-dna-system text-dna-ink-light">
                                    {'→ '}
                                    <Link
                                        href={entry.stackLink}
                                        className="border-b border-dotted border-dna-ink-light no-underline hover:border-solid hover:text-dna-ink"
                                    >
                                        {entry.stackLabel} series
                                    </Link>
                                </div>
                            )}
                            <div className="text-dna-ui text-dna-ink-light">
                                @{' '}
                                {entry.artists && entry.artists.length > 0 ? (
                                    <LineupText artists={entry.artists} fallback={entry.venue} />
                                ) : (
                                    entry.venue
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
