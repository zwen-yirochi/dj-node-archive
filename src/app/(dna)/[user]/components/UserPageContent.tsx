import Link from 'next/link';

import {
    isEventEntry,
    isPublicEventEntry,
    type ContentEntry,
    type EventEntry,
    type HeaderStyle,
    type ProfileLink,
    type User,
} from '@/types/domain';
import { formatEventDate, venueCode } from '@/lib/formatters';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { EntryCard } from '@/components/dna/EntryCard';
import { headerRenderers } from '@/components/dna/headers';
import { ImageFrame } from '@/components/dna/ImageFrame';
import { MetaTable } from '@/components/dna/MetaTable';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { StatsRow } from '@/components/dna/StatsRow';
import { Timeline } from '@/components/dna/Timeline';
import { VenueLink } from '@/components/dna/VenueLink';

interface Props {
    user: User;
    entries: ContentEntry[];
    headerStyle?: HeaderStyle;
    links?: ProfileLink[];
}

export default function UserPageContent({
    user,
    entries,
    headerStyle = 'minimal',
    links = [],
}: Props) {
    const eventEntries = entries.filter((e) => e.type === 'event') as EventEntry[];
    const otherEntries = entries.filter((e) => e.type !== 'event');

    // Recent events for card grid (top 3)
    const recentEvents = eventEntries.slice(0, 3);
    // Remaining events for timeline
    const timelineEvents = eventEntries.slice(3);

    const uniqueVenues = new Set(eventEntries.map((e) => e.venue?.name).filter(Boolean));

    const HeaderComponent = headerRenderers[headerStyle];

    return (
        <DnaPageShell
            pathBar={{
                path: `root / nodes / ${user.username}`,
                meta: 'node type: artist // status: active',
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // NODE: ${user.username.toUpperCase()}`]}
        >
            {/* ── Profile Header ── */}
            <HeaderComponent user={user} entries={entries} links={links} />

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
            <div className="grid grid-cols-1 gap-dna-gap md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Node Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Username', value: user.username },
                            { key: 'Display Name', value: user.displayName },
                            { key: 'Links', value: String(links.length) },
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
                                        <div className="border border-dna-ink-faint p-4">
                                            {event.posterUrls[0] && (
                                                <ImageFrame
                                                    src={event.posterUrls[0]}
                                                    alt={event.title}
                                                    className="mb-3 aspect-[4/3]"
                                                />
                                            )}
                                            <div className="dna-text-meta">
                                                {formatEventDate(event.date)}
                                            </div>
                                            <h3 className="mt-1 text-sm font-semibold uppercase leading-snug">
                                                {event.title}
                                            </h3>
                                            {event.venue?.name && (
                                                <div className="mt-1 text-xs text-dna-ink-light">
                                                    @{' '}
                                                    <VenueLink
                                                        name={event.venue.name}
                                                        venueId={event.venue.id}
                                                    />
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
        </DnaPageShell>
    );
}
