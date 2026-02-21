import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TimelineEntry {
    date: string;
    title: string;
    venue: string;
    link?: string;
}

interface TimelineProps {
    entries: TimelineEntry[];
    className?: string;
}

export function Timeline({ entries, className }: TimelineProps) {
    return (
        <div className={cn('relative my-3 pl-6', className)}>
            {/* Vertical dashed line */}
            <div className="absolute bottom-1 left-1 top-1 w-0 border-l border-dashed border-dna-ink-ghost" />

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

                    <div className="text-dna-label uppercase tracking-dna-meta text-dna-ink-light">
                        {entry.date}
                    </div>
                    <div className="my-0.5 text-dna-item font-semibold">{entry.title}</div>
                    <div className="text-[10px] text-dna-ink-light">
                        @{' '}
                        {entry.link ? (
                            <Link
                                href={entry.link}
                                className="border-b border-dotted border-dna-accent-blue text-dna-accent-blue no-underline hover:border-solid"
                            >
                                {entry.venue}
                            </Link>
                        ) : (
                            entry.venue
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
