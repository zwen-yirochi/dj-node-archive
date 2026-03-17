import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface DnaBreadcrumbProps {
    items: BreadcrumbItem[];
}

export function DnaBreadcrumb({ items }: DnaBreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 text-dna-label tracking-dna-system text-dna-ink-light">
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-dna-ink-ghost">/</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="uppercase text-dna-ink-light no-underline hover:text-dna-ink"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="uppercase text-dna-ink">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
