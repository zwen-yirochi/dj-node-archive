import Link from 'next/link';

import { cn } from '@/lib/utils';

import { TypeBadge } from './TypeBadge';

type NodeType = 'VEN' | 'ART' | 'EVT';

interface NodeItemProps {
    index: number;
    type: NodeType;
    name: string;
    detail: string;
    href: string;
    className?: string;
}

export function NodeItem({ index, type, name, detail, href, className }: NodeItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                'dna-border-row group flex cursor-pointer items-center gap-3 border-b py-2.5 last:border-b-0',
                className
            )}
        >
            <span className="min-w-[24px] text-dna-label text-dna-ink-ghost">
                {String(index).padStart(2, '0')}
            </span>
            <TypeBadge type={type} />
            <span className="flex-1 text-dna-body font-medium group-hover:underline">{name}</span>
            <span className="text-dna-label tracking-dna-detail text-dna-ink-light">{detail}</span>
            <span className="text-dna-meta-val text-dna-ink-ghost">&rarr;</span>
        </Link>
    );
}
