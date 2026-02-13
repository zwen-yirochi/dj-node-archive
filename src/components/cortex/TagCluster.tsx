import { cn } from '@/lib/utils';

interface Tag {
    label: string;
    active?: boolean;
}

interface TagClusterProps {
    tags: Tag[];
    className?: string;
    onTagClick?: (label: string) => void;
}

export function TagCluster({ tags, className, onTagClick }: TagClusterProps) {
    return (
        <div className={cn('my-3.5 flex flex-wrap gap-1.5', className)}>
            {tags.map((tag) => (
                <span
                    key={tag.label}
                    onClick={() => onTagClick?.(tag.label)}
                    className={cn(
                        'cursor-pointer border border-cortex-ink-faint px-2.5 py-1 text-cortex-label uppercase tracking-cortex-system text-cortex-ink-mid hover:border-cortex-ink hover:text-cortex-ink',
                        tag.active &&
                            'border-cortex-ink bg-cortex-ink text-cortex-bg hover:bg-cortex-ink hover:text-cortex-bg'
                    )}
                >
                    {tag.label}
                </span>
            ))}
        </div>
    );
}
