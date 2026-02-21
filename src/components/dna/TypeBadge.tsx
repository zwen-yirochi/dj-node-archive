import { cn } from '@/lib/utils';

export type BadgeType = 'VEN' | 'ART' | 'EVT' | 'MIX' | 'LNK';

interface TypeBadgeProps {
    type: BadgeType;
    className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
    return (
        <span
            className={cn(
                'min-w-[32px] border border-dna-ink-faint px-[5px] py-0.5 text-center text-dna-system uppercase tracking-dna-system text-dna-ink-light',
                className
            )}
        >
            {type}
        </span>
    );
}
