import { cn } from '@/lib/utils';
import { venueCode } from '@/lib/formatters';
import Link from 'next/link';

interface VenueLinkProps {
    name: string;
    venueId?: string | null;
    href?: string;
    className?: string;
}

export function VenueLink({ name, venueId, href, className }: VenueLinkProps) {
    const code = venueCode(venueId);
    const content = (
        <span
            className={cn(
                'border-b border-dotted border-dna-accent-blue text-dna-accent-blue',
                className
            )}
        >
            {name} [{code}]
        </span>
    );

    if (href) {
        return (
            <Link href={href} className="no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
