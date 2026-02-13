import type { ContentEntry, User } from '@/types/domain';
import { TopNav } from '@/components/cortex/TopNav';
import { PathBar } from '@/components/cortex/PathBar';
import { SectionLabel } from '@/components/cortex/SectionLabel';
import { MetaTable } from '@/components/cortex/MetaTable';
import { AsciiDivider } from '@/components/cortex/AsciiDivider';
import { Footer } from '@/components/cortex/Footer';
import EntryCard from './EntryCard';
import ShareButton from './ShareButton';

interface Props {
    user: User;
    entries: ContentEntry[];
}

export default function UserPageContent({ user, entries }: Props) {
    const socialLinks: { key: string; value: string }[] = [];
    if (user.instagram) socialLinks.push({ key: 'Instagram', value: user.instagram });
    if (user.soundcloud) socialLinks.push({ key: 'SoundCloud', value: user.soundcloud });

    return (
        <div className="mx-auto max-w-cortex px-cortex-gutter">
            <TopNav
                logo="CTX:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover' },
                ]}
            />

            <PathBar
                path={`root / nodes / ${user.username}`}
                meta="node type: artist // status: active"
            />

            {/* Profile Header */}
            <section className="pb-6 pt-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2.5 text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light">
                            <span>Artist Node</span>
                            <span className="h-0 flex-1 border-t border-dotted border-cortex-ink-ghost" />
                        </div>
                        <h1 className="font-mono-alt text-[28px] font-bold uppercase leading-none tracking-cortex-tight md:text-[40px]">
                            {user.displayName}
                        </h1>
                        <div className="mt-1 text-cortex-meta-val tracking-[0.5px] text-cortex-ink-light">
                            @{user.username}
                        </div>
                        {user.bio && (
                            <p className="mt-4 max-w-[520px] text-cortex-body text-cortex-ink-mid">
                                {user.bio}
                            </p>
                        )}
                    </div>
                    <ShareButton />
                </div>

                {/* Social links */}
                {socialLinks.length > 0 && (
                    <div className="mt-4 flex items-center gap-5">
                        <span className="border-b border-dotted border-cortex-ink-ghost pb-0.5 text-cortex-label uppercase tracking-cortex-btn text-cortex-ink-light">
                            Links
                        </span>
                        <div className="flex gap-5 text-cortex-meta-val font-medium uppercase tracking-cortex-system">
                            {user.instagram && (
                                <a
                                    href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                >
                                    Instagram
                                </a>
                            )}
                            {user.soundcloud && (
                                <a
                                    href={`https://soundcloud.com/${user.soundcloud}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                >
                                    SoundCloud
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Meta */}
            <MetaTable
                items={[
                    { key: 'Username', value: user.username },
                    { key: 'Entries', value: String(entries.length) },
                    ...(user.instagram ? [{ key: 'Instagram', value: user.instagram }] : []),
                ]}
            />

            <AsciiDivider text="ARCHIVE" />

            {/* Entries */}
            <section>
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
                meta={[`PROTOCOL: CTX-ARCHIVE // NODE: ${user.username.toUpperCase()}`]}
                bottom={{
                    left: 'CORTEX ARCHIVE // 2025',
                    right: 'SECTOR-9 // KR',
                }}
            />
        </div>
    );
}
