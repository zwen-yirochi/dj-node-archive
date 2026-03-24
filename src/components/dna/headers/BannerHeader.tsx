import { NodeLabel } from '@/components/dna/NodeLabel';

import type { HeaderProps } from '.';
import { HeaderTags, SocialLinks, toTagLinks } from './MinimalHeader';

/** Banner — wide banner area with side-by-side layout */
export function BannerHeader({ user, entries, links }: HeaderProps) {
    const activeLinks = toTagLinks(links);

    return (
        <section className="pb-6 pt-6 md:pt-8">
            {/* Banner area */}
            <div className="relative mb-6 overflow-hidden border border-dna-ink-faint bg-dna-bg-dark">
                {user.avatarUrl ? (
                    <div className="aspect-[3/1] w-full">
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="h-full w-full object-cover opacity-60 mix-blend-multiply grayscale"
                        />
                        {/* Duotone overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-dna-ink/20 to-transparent" />
                    </div>
                ) : (
                    <div className="aspect-[3/1] w-full bg-gradient-to-r from-dna-bg-dark to-dna-bg-tint" />
                )}

                {/* Corner marks */}
                <div className="absolute left-1 top-1 h-3 w-3 border-l border-t border-dna-ink-ghost" />
                <div className="absolute right-1 top-1 h-3 w-3 border-r border-t border-dna-ink-ghost" />
                <div className="absolute bottom-1 left-1 h-3 w-3 border-b border-l border-dna-ink-ghost" />
                <div className="absolute bottom-1 right-1 h-3 w-3 border-b border-r border-dna-ink-ghost" />

                {/* System label */}
                <div className="absolute bottom-2 right-3 text-dna-system tracking-dna-meta text-dna-ink-ghost">
                    HEADER // BANNER
                </div>
            </div>

            {/* Profile info below banner */}
            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-6 md:text-left">
                {user.avatarUrl && (
                    <div className="-mt-12 mb-3 h-20 w-20 flex-shrink-0 overflow-hidden border-2 border-dna-bg bg-dna-bg md:-mt-14 md:mb-0 md:h-24 md:w-24">
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
                    {user.bio && <p className="dna-text-body mt-3 md:max-w-[520px]">{user.bio}</p>}
                    <HeaderTags links={activeLinks} />
                </div>
            </div>
        </section>
    );
}
