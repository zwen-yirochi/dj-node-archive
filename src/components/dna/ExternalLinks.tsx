import { cn } from '@/lib/utils';

interface ExternalLinksProps {
    links: Array<{ label: string; href: string }>;
    className?: string;
}

export function ExternalLinks({ links, className }: ExternalLinksProps) {
    if (links.length === 0) return null;

    return (
        <div className={cn('mt-3 flex flex-wrap items-center gap-4 md:gap-5', className)}>
            <span className="dna-border-relation border-b pb-0.5 text-dna-label uppercase tracking-dna-btn text-dna-ink-light">
                Links
            </span>
            {links.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dna-border-relation dna-text-link border-b pb-px hover:border-dna-ink hover:text-dna-ink"
                >
                    {link.label}
                </a>
            ))}
        </div>
    );
}
