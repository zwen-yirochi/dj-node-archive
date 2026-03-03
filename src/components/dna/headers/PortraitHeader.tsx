import { NodeLabel } from '@/components/dna/NodeLabel';
import ShareButton from '@/components/dna/ShareButton';

import type { HeaderProps } from '.';
import { HeaderTags, SocialLinks } from './MinimalHeader';

/** Portrait — large centered portrait with profile info below */
export function PortraitHeader({ user, entries }: HeaderProps) {
    const hasEvents = entries.some((e) => e.type === 'event');
    const hasMixsets = entries.some((e) => e.type === 'mixset');

    return (
        <section className="pb-6 pt-6 md:pt-8">
            <div className="flex flex-col items-center text-center">
                {/* Large portrait */}
                {user.avatarUrl && (
                    <div className="relative mb-5 w-48 overflow-hidden border border-dna-ink-faint bg-dna-bg-dark md:w-56">
                        <div className="aspect-[4/5]">
                            <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="contrast-110 h-full w-full object-cover mix-blend-multiply brightness-105 grayscale-[85%]"
                            />
                            {/* Duotone overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(34,85,170,0.12)] to-[rgba(192,57,43,0.08)]" />
                        </div>

                        {/* Corner marks */}
                        <div className="absolute left-1 top-1 h-3 w-3 border-l border-t border-dna-ink-ghost" />
                        <div className="absolute right-1 top-1 h-3 w-3 border-r border-t border-dna-ink-ghost" />
                        <div className="absolute bottom-1 left-1 h-3 w-3 border-b border-l border-dna-ink-ghost" />
                        <div className="absolute bottom-1 right-1 h-3 w-3 border-b border-r border-dna-ink-ghost" />

                        {/* Meta bar */}
                        <div className="border-t border-dna-ink-faint px-2 py-1 text-dna-system tracking-dna-meta text-dna-ink-ghost">
                            NODE: {user.username.toUpperCase()} // PORTRAIT
                        </div>
                    </div>
                )}

                {/* Profile info */}
                <NodeLabel>Artist Node</NodeLabel>
                <h1 className="dna-heading-page md:mt-2">{user.displayName}</h1>
                <div className="mt-1 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                    @{user.username}
                </div>
                {user.bio && (
                    <p className="dna-text-body mx-auto mt-3 max-w-[480px] md:mt-4">{user.bio}</p>
                )}

                <HeaderTags hasEvents={hasEvents} hasMixsets={hasMixsets} />
                <SocialLinks
                    instagram={user.instagram}
                    soundcloud={user.soundcloud}
                    className="mt-2 justify-center"
                />
                <div className="mt-3 md:mt-4">
                    <ShareButton />
                </div>
            </div>
        </section>
    );
}
