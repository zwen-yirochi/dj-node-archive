import { NodeLabel } from '@/components/dna/NodeLabel';

import type { HeaderProps } from '.';
import { HeaderTags, SocialLinks } from './MinimalHeader';

/** Shapes — geometric decorative header with grid pattern */
export function ShapesHeader({ user, entries, links }: HeaderProps) {
    const hasEvents = entries.some((e) => e.type === 'event');
    const hasMixsets = entries.some((e) => e.type === 'mixset');

    return (
        <section className="pb-6 pt-6 md:pt-8">
            {/* Geometric decoration */}
            <div className="relative mb-6 border border-dna-ink-faint bg-dna-bg-tint p-6 md:p-8">
                {/* Grid pattern overlay */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                {/* Decorative shapes */}
                <div className="absolute right-6 top-6 h-16 w-16 rotate-45 border border-dna-ink-faint md:h-20 md:w-20" />
                <div className="absolute right-10 top-10 h-8 w-8 rotate-45 border border-dna-ink-ghost md:h-10 md:w-10" />
                <div className="absolute bottom-6 left-6 h-12 w-12 rounded-full border border-dashed border-dna-ink-ghost" />

                {/* Corner marks */}
                <div className="absolute left-1 top-1 h-3 w-3 border-l border-t border-dna-ink-ghost" />
                <div className="absolute right-1 top-1 h-3 w-3 border-r border-t border-dna-ink-ghost" />
                <div className="absolute bottom-1 left-1 h-3 w-3 border-b border-l border-dna-ink-ghost" />
                <div className="absolute bottom-1 right-1 h-3 w-3 border-b border-r border-dna-ink-ghost" />

                {/* Content */}
                <div className="relative flex flex-col items-center text-center md:flex-row md:items-start md:gap-6 md:text-left">
                    {user.avatarUrl && (
                        <div className="mb-4 h-20 w-20 flex-shrink-0 overflow-hidden border border-dna-ink-faint md:mb-0 md:h-24 md:w-24">
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
                            <p className="dna-text-body mt-3 md:mt-4 md:max-w-[520px]">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* System label */}
                <div className="relative mt-3 text-center text-dna-system tracking-dna-meta text-dna-ink-ghost md:text-left">
                    SYS: HEADER_SHAPES // NODE: {user.username.toUpperCase()}
                </div>
            </div>

            {/* Tags, links, share below the box */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <HeaderTags hasEvents={hasEvents} hasMixsets={hasMixsets} />
            </div>
        </section>
    );
}
