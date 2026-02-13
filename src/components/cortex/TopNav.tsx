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
                'flex items-center justify-between border-b border-dashed border-cortex-ink-ghost py-5',
                className
            )}
        >
            <div className="cursor-default font-mono-alt text-lg font-bold tracking-cortex-tight">
                {logo}
            </div>

            <div className="hidden gap-7 text-[10px] uppercase tracking-cortex-meta text-cortex-ink-mid md:flex">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'border-b border-dotted border-cortex-ink-ghost pb-0.5 hover:border-cortex-ink hover:text-cortex-ink',
                            link.active && 'border-solid border-cortex-ink text-cortex-ink'
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {version && (
                <div className="text-[9px] uppercase tracking-cortex-system text-cortex-ink-ghost">
                    {version}
                </div>
            )}
        </nav>
    );
}
