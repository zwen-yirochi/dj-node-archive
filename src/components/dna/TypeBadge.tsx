import { cn } from '@/lib/utils';

export type BadgeType = 'VEN' | 'ART' | 'EVT' | 'MIX' | 'LNK' | 'BLK';

const sizeStyles = {
    default: 'min-w-[32px] px-[5px] py-0.5 text-dna-system tracking-dna-system',
    sm: 'min-w-[28px] px-1 py-px text-dna-system tracking-[0.8px]',
} as const;

interface TypeBadgeProps {
    type: BadgeType;
    size?: keyof typeof sizeStyles;
    className?: string;
}

export function TypeBadge({ type, size = 'default', className }: TypeBadgeProps) {
    return (
        <span
            className={cn(
                'border border-dna-ink-faint text-center uppercase text-dna-ink-light',
                sizeStyles[size],
                className
            )}
        >
            {type}
        </span>
    );
}
