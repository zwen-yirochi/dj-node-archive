import Link from 'next/link';

import { cn } from '@/lib/utils';

export interface PathBarItem {
    label: string;
    href?: string;
}

interface PathBarProps {
    items: PathBarItem[];
    meta?: string;
    className?: string;
}

export function PathBar({ items, meta, className }: PathBarProps) {
    return (
        <nav
            className={cn(
                'flex justify-between border-b border-dna-ink-faint py-2.5 text-dna-label uppercase tracking-dna-system text-dna-ink-light',
                className
            )}
        >
            <div className="flex items-center gap-1">
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-dna-ink-ghost">/</span>}
                        {item.href ? (
                            <Link href={item.href} className="no-underline hover:text-dna-ink">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-dna-ink">{item.label}</span>
                        )}
                    </span>
                ))}
            </div>
            {meta && <span className="text-dna-ink-ghost">{meta}</span>}
        </nav>
    );
}
