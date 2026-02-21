import { cn } from '@/lib/utils';

interface PathBarProps {
    path: string;
    meta?: string;
    className?: string;
}

export function PathBar({ path, meta, className }: PathBarProps) {
    return (
        <div
            className={cn(
                'flex justify-between border-b border-dna-ink-faint py-2.5 text-dna-label uppercase tracking-dna-system text-dna-ink-light',
                className
            )}
        >
            <span>{path}</span>
            {meta && <span className="text-dna-ink-ghost">{meta}</span>}
        </div>
    );
}
