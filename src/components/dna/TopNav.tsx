import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLink {
    label: string;
    href: string;
    active?: boolean;
}

interface TopNavProps {
    logo?: string;
    links: NavLink[];
    version?: string;
    className?: string;
}

export function TopNav({ logo = 'CTX:', links, version, className }: TopNavProps) {
    return (
        <nav
            className={cn(
                'flex items-center justify-between border-b border-dashed border-dna-ink-ghost py-5',
                className
            )}
        >
            <div className="cursor-default font-mono-alt text-lg font-bold tracking-dna-tight">
                {logo}
            </div>

            <div className="hidden gap-7 text-dna-ui uppercase tracking-dna-meta text-dna-ink-mid md:flex">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'border-b border-dotted border-dna-ink-ghost pb-0.5 hover:border-dna-ink hover:text-dna-ink',
                            link.active && 'border-solid border-dna-ink text-dna-ink'
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {version && (
                <div className="text-dna-label uppercase tracking-dna-system text-dna-ink-ghost">
                    {version}
                </div>
            )}
        </nav>
    );
}
