import type { EventEntry, ProfileLink } from '@/types/domain';
import { ExternalLinks } from '@/components/dna/ExternalLinks';
import { NodeLabel } from '@/components/dna/NodeLabel';

import type { HeaderProps } from '.';

/** Minimal — clean centered/left layout with avatar and bio (default) */
export function MinimalHeader({ user, entries, links }: HeaderProps) {
    const activeLinks = toTagLinks(links);

    return (
        <section className="pb-6 pt-6 md:pt-8">
            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                {user.avatarUrl && (
                    <div className="mb-4 h-20 w-20 flex-shrink-0 overflow-hidden border border-dna-ink-faint md:mb-0 md:mr-6 md:h-24 md:w-24">
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                <div className="flex-1">
                    <NodeLabel>Artist Node</NodeLabel>
                    <h1 className="dna-heading-page md:mt-2">{user.displayName}</h1>
                    <div className="mt-1 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                        @{user.username}
                    </div>
                    {user.bio && (
                        <p className="dna-text-body mt-3 md:mt-4 md:max-w-[520px]">{user.bio}</p>
                    )}

                    <HeaderTags links={activeLinks} />
                </div>
            </div>
        </section>
    );
}

// ── Shared sub-components ──

export function HeaderTags({ links }: { links: { label: string; href: string }[] }) {
    if (links.length === 0) return null;

    return (
        <div className="my-3.5 flex flex-wrap gap-1.5">
            {links.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-dna-ink-faint px-2.5 py-1 text-dna-label uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink hover:text-dna-ink"
                >
                    {link.label}
                </a>
            ))}
        </div>
    );
}

const PLATFORM_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    bandcamp: 'Bandcamp',
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    soundcloud: 'SoundCloud',
};

export function toTagLinks(links: ProfileLink[]) {
    return links
        .filter((l) => l.url && l.enabled !== false)
        .map((l) => ({
            label: l.type === 'custom' ? l.label || 'Link' : (PLATFORM_LABELS[l.type] ?? l.type),
            href: l.url,
        }));
}

export function SocialLinks({ links, className }: { links: ProfileLink[]; className?: string }) {
    if (links.length === 0) return null;

    const externalLinks = links
        .filter((link) => link.url && link.enabled !== false)
        .map((link) => ({
            label:
                link.type === 'custom'
                    ? link.label || 'Link'
                    : (PLATFORM_LABELS[link.type] ?? link.type),
            href: link.url,
        }));

    if (externalLinks.length === 0) return null;

    return (
        <ExternalLinks
            links={externalLinks}
            className={className ?? 'mt-2 justify-center md:justify-start'}
        />
    );
}
