import type { ContentEntry, EventEntry, User } from '@/types/domain';
import { isEventEntry, isPublicEventEntry } from '@/types/domain';
import Link from 'next/link';
import { TopNav } from '@/components/cortex/TopNav';
import { PathBar } from '@/components/cortex/PathBar';
import { SectionLabel } from '@/components/cortex/SectionLabel';
import { StatsRow } from '@/components/cortex/StatsRow';
import { MetaTable } from '@/components/cortex/MetaTable';
import { Timeline } from '@/components/cortex/Timeline';
import { AsciiDivider } from '@/components/cortex/AsciiDivider';
import { Footer } from '@/components/cortex/Footer';
import EntryCard from './EntryCard';
import ShareButton from './ShareButton';

interface Props {
    user: User;
    entries: ContentEntry[];
}

function venueCode(id?: string): string {
    if (!id) return 'VN-0000';
    return `VN-${id.slice(0, 4).toUpperCase()}`;
}

function formatEventDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        return `${yyyy}.${mm}.${dd} // ${day}`;
    } catch {
        return dateStr;
    }
}

export default function UserPageContent({ user, entries }: Props) {
    const eventEntries = entries.filter((e) => e.type === 'event') as EventEntry[];
    const otherEntries = entries.filter((e) => e.type !== 'event');

    // Recent events for card grid (top 3)
    const recentEvents = eventEntries.slice(0, 3);
    // Remaining events for timeline
    const timelineEvents = eventEntries.slice(3);

    const uniqueVenues = new Set(eventEntries.map((e) => e.venue?.name).filter(Boolean));

    return (
        <div className="mx-auto max-w-cortex px-4 md:px-cortex-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover' },
                ]}
            />

            <div className="hidden md:block">
                <PathBar
                    path={`root / nodes / ${user.username}`}
                    meta="node type: artist // status: active"
                />
            </div>

            {/* ── Profile Header ── */}
            <section className="pb-6 pt-6 md:pt-8">
                <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
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

                        {/* Tags (static — no onClick) */}
                        <div className="my-3.5 flex flex-wrap gap-1.5">
                            {[
                                { label: 'DJ', active: true },
                                ...(eventEntries.length > 0 ? [{ label: 'Events' }] : []),
                                ...(otherEntries.some((e) => e.type === 'mixset')
                                    ? [{ label: 'Mixset' }]
                                    : []),
                            ].map((tag) => (
                                <span
                                    key={tag.label}
                                    className={`border px-2.5 py-1 text-cortex-label uppercase tracking-cortex-system ${
                                        tag.active
                                            ? 'border-cortex-ink bg-cortex-ink text-cortex-bg'
                                            : 'border-cortex-ink-faint text-cortex-ink-mid'
                                    }`}
                                >
                                    {tag.label}
                                </span>
                            ))}
                        </div>

                        {/* Social links */}
                        {(user.instagram || user.soundcloud) && (
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 md:justify-start md:gap-5">
                                <span className="border-b border-dotted border-cortex-ink-ghost pb-0.5 text-cortex-label uppercase tracking-cortex-btn text-cortex-ink-light">
                                    Links
                                </span>
                                {user.instagram && (
                                    <a
                                        href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-meta-val font-medium uppercase tracking-cortex-system text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                    >
                                        Instagram
                                    </a>
                                )}
                                {user.soundcloud && (
                                    <a
                                        href={`https://soundcloud.com/${user.soundcloud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-meta-val font-medium uppercase tracking-cortex-system text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                    >
                                        SoundCloud
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="mt-3 md:mt-4">
                            <ShareButton />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <StatsRow
                stats={[
                    { number: String(eventEntries.length), label: 'Events' },
                    { number: String(uniqueVenues.size), label: 'Venues' },
                    { number: String(otherEntries.length), label: 'Other' },
                    { number: String(entries.length), label: 'Total' },
                ]}
            />

            {/* ── Metadata ── */}
            <div className="grid grid-cols-1 gap-cortex-gap md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Node Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Username', value: user.username },
                            { key: 'Display Name', value: user.displayName },
                            {
                                key: 'Instagram',
                                value: user.instagram || 'NULL',
                            },
                            {
                                key: 'SoundCloud',
                                value: user.soundcloud || 'NULL',
                            },
                            { key: 'Entries', value: String(entries.length) },
                            { key: 'Status', value: 'ACTIVE' },
                        ]}
                    />
                </div>
                <div className="hidden md:block">
                    <SectionLabel right="SYS">Archive Status</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Events', value: String(eventEntries.length) },
                            { key: 'Venues', value: String(uniqueVenues.size) },
                            {
                                key: 'Mixsets',
                                value: String(
                                    otherEntries.filter((e) => e.type === 'mixset').length
                                ),
                            },
                            {
                                key: 'Links',
                                value: String(otherEntries.filter((e) => e.type === 'link').length),
                            },
                        ]}
                    />
                </div>
            </div>

            {/* ── Event History ── */}
            {eventEntries.length > 0 && (
                <>
                    {/* Mobile: 리스트 뷰 */}
                    <section className="my-5 md:hidden">
                        <SectionLabel right={`${eventEntries.length} EVENTS`}>
                            Event History
                        </SectionLabel>
                        <div className="my-3">
                            {eventEntries.map((entry, i) => (
                                <EntryCard key={entry.id} entry={entry} index={i} />
                            ))}
                        </div>
                    </section>

                    {/* Desktop: 카드 그리드 + 타임라인 */}
                    <div className="hidden md:block">
                        <AsciiDivider text="EVENT HISTORY" />

                        {/* Recent events — card grid */}
                        {recentEvents.length > 0 && (
                            <div className="my-5 grid grid-cols-3 gap-4">
                                {recentEvents.map((event) => {
                                    const href = isPublicEventEntry(event)
                                        ? `/event/${event.eventId}`
                                        : null;
                                    const card = (
                                        <div className="border border-cortex-ink-faint p-4">
                                            {event.posterUrl && (
                                                <div className="mb-3 aspect-[4/3] w-full overflow-hidden border border-cortex-ink-faint bg-cortex-bg-dark">
                                                    <img
                                                        src={event.posterUrl}
                                                        alt={event.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="text-cortex-label uppercase tracking-cortex-meta text-cortex-ink-light">
                                                {formatEventDate(event.date)}
                                            </div>
                                            <h3 className="mt-1 text-sm font-semibold uppercase leading-snug">
                                                {event.title}
                                            </h3>
                                            {event.venue?.name && (
                                                <div className="mt-1 text-xs text-cortex-ink-light">
                                                    @{' '}
                                                    <span className="border-b border-dotted border-cortex-accent-blue text-cortex-accent-blue">
                                                        {event.venue.name} [
                                                        {venueCode(event.venue.id)}]
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );

                                    if (href) {
                                        return (
                                            <Link
                                                key={event.id}
                                                href={href}
                                                className="block no-underline hover:opacity-80"
                                            >
                                                {card}
                                            </Link>
                                        );
                                    }
                                    return <div key={event.id}>{card}</div>;
                                })}
                            </div>
                        )}

                        {/* Remaining events — timeline */}
                        {timelineEvents.length > 0 && (
                            <section className="my-5">
                                <Timeline
                                    entries={timelineEvents.map((event) => ({
                                        date: formatEventDate(event.date),
                                        title: event.title,
                                        venue: event.venue?.name
                                            ? `${event.venue.name} [${venueCode(event.venue.id)}]`
                                            : 'UNKNOWN VENUE',
                                        link:
                                            isEventEntry(event) && isPublicEventEntry(event)
                                                ? `/event/${event.eventId}`
                                                : undefined,
                                    }))}
                                />
                            </section>
                        )}
                    </div>
                </>
            )}

            {/* ── Other Entries (Mixset, Link) ── */}
            {otherEntries.length > 0 && (
                <section className="my-5">
                    <SectionLabel right={`${otherEntries.length} ITEMS`}>
                        Other Entries
                    </SectionLabel>
                    <div className="my-3">
                        {otherEntries.map((entry, i) => (
                            <EntryCard key={entry.id} entry={entry} index={i} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Footer ── */}
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
