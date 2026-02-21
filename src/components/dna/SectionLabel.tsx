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
                'mb-3.5 flex items-center gap-2.5 border-b border-dotted border-dna-ink-ghost pb-2 text-dna-label uppercase tracking-dna-label text-dna-ink-light',
                className
            )}
        >
            <span>{children}</span>
            <span className="h-0 flex-1 border-t border-dotted border-dna-ink-ghost" />
            {right && (
                <span className="text-dna-system tracking-dna-system text-dna-ink-ghost">
                    {right}
                </span>
            )}
        </div>
    );
}
