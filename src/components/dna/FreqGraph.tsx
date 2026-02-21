'use client';

import { cn } from '@/lib/utils';

interface FreqBar {
    height: number; // 0-100
}

interface FreqGraphProps {
    bars: FreqBar[];
    className?: string;
}

function getBarVariant(height: number): string {
    if (height > 80) return 'bg-dna-ink';
    if (height > 55) return 'bg-dna-ink-mid';
    if (height > 30) return 'bg-dna-ink-ghost';
    return 'bg-dna-ink-faint';
}

export function FreqGraph({ bars, className }: FreqGraphProps) {
    return (
        <div className={cn('my-3 flex h-9 items-end gap-0.5', className)}>
            {bars.map((bar, i) => (
                <div
                    key={i}
                    className={cn('min-h-[2px] flex-1', getBarVariant(bar.height))}
                    style={{ height: `${Math.max(bar.height, 5)}%` }}
                />
            ))}
        </div>
    );
}
