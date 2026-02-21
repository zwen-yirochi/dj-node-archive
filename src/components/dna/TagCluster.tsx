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
                        'cursor-pointer border border-dna-ink-faint px-2.5 py-1 text-dna-label uppercase tracking-dna-system text-dna-ink-mid hover:border-dna-ink hover:text-dna-ink',
                        tag.active &&
                            'border-dna-ink bg-dna-ink text-dna-bg hover:bg-dna-ink hover:text-dna-bg'
                    )}
                >
                    {tag.label}
                </span>
            ))}
        </div>
    );
}
