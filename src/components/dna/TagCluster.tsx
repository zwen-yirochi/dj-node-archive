import { cn } from '@/lib/utils';

interface Tag {
    label: string;
    href?: string;
    active?: boolean;
}

interface TagClusterProps {
    tags: Tag[];
    className?: string;
    onTagClick?: (label: string) => void;
}

export function TagCluster({ tags, className, onTagClick }: TagClusterProps) {
    const baseStyle =
        'cursor-pointer border border-dna-ink-faint px-2.5 py-1 text-dna-label uppercase tracking-dna-system text-dna-ink-mid hover:border-dna-ink hover:text-dna-ink';
    const activeStyle = 'border-dna-ink bg-dna-ink text-dna-bg hover:bg-dna-ink hover:text-dna-bg';

    return (
        <div className={cn('my-3.5 flex flex-wrap gap-1.5', className)}>
            {tags.map((tag) =>
                tag.href ? (
                    <a
                        key={tag.label}
                        href={tag.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(baseStyle, 'no-underline', tag.active && activeStyle)}
                    >
                        {tag.label}
                    </a>
                ) : (
                    <span
                        key={tag.label}
                        onClick={() => onTagClick?.(tag.label)}
                        className={cn(baseStyle, tag.active && activeStyle)}
                    >
                        {tag.label}
                    </span>
                )
            )}
        </div>
    );
}
