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
                'dna-border-relation dna-text-node mb-3.5 flex items-center gap-2.5 border-b pb-2',
                className
            )}
        >
            <span>{children}</span>
            <span className="dna-border-relation h-0 flex-1 border-t" />
            {right && (
                <span className="text-dna-system tracking-dna-system text-dna-ink-ghost">
                    {right}
                </span>
            )}
        </div>
    );
}
