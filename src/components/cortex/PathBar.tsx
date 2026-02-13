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
                'flex justify-between border-b border-cortex-ink-faint py-2.5 text-cortex-label uppercase tracking-cortex-system text-cortex-ink-light',
                className
            )}
        >
            <span>{path}</span>
            {meta && <span className="text-cortex-ink-ghost">{meta}</span>}
        </div>
    );
}
