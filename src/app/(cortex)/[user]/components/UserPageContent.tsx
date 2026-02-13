import type { ContentEntry, User } from '@/types/domain';
import { TopNav } from '@/components/cortex/TopNav';
import { PathBar } from '@/components/cortex/PathBar';
import { SectionLabel } from '@/components/cortex/SectionLabel';
import { Footer } from '@/components/cortex/Footer';
import EntryCard from './EntryCard';
import ShareButton from './ShareButton';

interface Props {
    user: User;
    entries: ContentEntry[];
}

export default function UserPageContent({ user, entries }: Props) {
    return (
        <div className="mx-auto max-w-cortex px-4 md:px-cortex-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover' },
                ]}
            />

            {/* Mobile: 숨김, Desktop: PathBar */}
            <div className="hidden md:block">
                <PathBar
                    path={`root / nodes / ${user.username}`}
                    meta="node type: artist // status: active"
                />
            </div>

            {/* ── Profile Header ── */}
            <section className="pb-6 pt-6 md:pt-8">
                {/* Mobile: 세로 스택, Desktop: 가로 배치 */}
                <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                    {/* Profile Image */}
                    {user.avatarUrl && (
                        <div className="mb-4 h-20 w-20 flex-shrink-0 overflow-hidden border border-cortex-ink-faint md:mb-0 md:mr-6 md:h-24 md:w-24">
                            <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="hidden items-center gap-2.5 text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light md:flex">
                            <span>Artist Node</span>
                            <span className="h-0 flex-1 border-t border-dotted border-cortex-ink-ghost" />
                        </div>
                        <h1 className="font-mono-alt text-[24px] font-bold uppercase leading-none tracking-cortex-tight md:mt-2 md:text-[40px]">
                            {user.displayName}
                        </h1>
                        <div className="mt-1 text-cortex-meta-val tracking-[0.5px] text-cortex-ink-light">
                            @{user.username}
                        </div>
                        {user.bio && (
                            <p className="mt-3 text-cortex-body text-cortex-ink-mid md:mt-4 md:max-w-[520px]">
                                {user.bio}
                            </p>
                        )}

                        {/* Social links */}
                        {(user.instagram || user.soundcloud) && (
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 md:justify-start md:gap-5">
                                {user.instagram && (
                                    <a
                                        href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-meta-val uppercase tracking-cortex-system text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                    >
                                        Instagram
                                    </a>
                                )}
                                {user.soundcloud && (
                                    <a
                                        href={`https://soundcloud.com/${user.soundcloud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-meta-val uppercase tracking-cortex-system text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                    >
                                        SoundCloud
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Mobile: Share 버튼 */}
                        <div className="mt-3 md:mt-4">
                            <ShareButton />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Entries ── */}
            <section className="mt-2">
                <SectionLabel right={`${entries.length} ENTRIES`}>Archive Index</SectionLabel>
                {entries.length > 0 ? (
                    <div className="my-3">
                        {entries.map((entry, i) => (
                            <EntryCard key={entry.id} entry={entry} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-cortex-body text-cortex-ink-light">
                        // NO ENTRIES REGISTERED
                    </div>
                )}
            </section>

            <Footer
                meta={[`DJ-NODE-ARCHIVE // NODE: ${user.username.toUpperCase()}`]}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: 'KR',
                }}
            />
        </div>
    );
}
