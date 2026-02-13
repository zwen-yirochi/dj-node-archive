import { cn } from '@/lib/utils';

interface SectionLabelProps {
    children: React.ReactNode;
    right?: string;
    className?: string;
}

export function SectionLabel({ children, right, className }: SectionLabelProps) {
    return (
        <div
            className={cn(
                'mb-3.5 flex items-center gap-2.5 border-b border-dotted border-cortex-ink-ghost pb-2 text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light',
                className
            )}
        >
            <span>{children}</span>
            <span className="h-0 flex-1 border-t border-dotted border-cortex-ink-ghost" />
            {right && (
                <span className="text-cortex-system tracking-cortex-system text-cortex-ink-ghost">
                    {right}
                </span>
            )}
        </div>
    );
}
