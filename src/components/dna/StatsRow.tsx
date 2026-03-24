import { cn } from '@/lib/utils';

interface Stat {
    number: string;
    label: string;
}

interface StatsRowProps {
    stats: Stat[];
    className?: string;
}

export function StatsRow({ stats, className }: StatsRowProps) {
    return (
        <div
            className={cn('my-6 grid gap-px border border-dna-ink/10 bg-dna-ink/[0.02]', className)}
            style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
        >
            {stats.map((stat, i) => (
                <div key={i} className="bg-transparent px-3.5 py-4 text-center">
                    <div className="mb-1 font-mono-alt text-2xl font-bold leading-none">
                        {stat.number}
                    </div>
                    <div className="text-dna-system uppercase tracking-dna-btn text-dna-ink-light">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
}
