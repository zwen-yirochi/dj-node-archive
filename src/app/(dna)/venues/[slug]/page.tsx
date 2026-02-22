import { AsciiBox } from '@/components/dna/AsciiBox';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { Button } from '@/components/dna/Button';
import { ExternalLinks } from '@/components/dna/ExternalLinks';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { MetaTable } from '@/components/dna/MetaTable';
import { NodeLabel } from '@/components/dna/NodeLabel';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { StatsRow } from '@/components/dna/StatsRow';
import { findEventsByVenueId } from '@/lib/db/queries/event.queries';
import { findStacksByVenueId } from '@/lib/db/queries/event-stack.queries';
import { formatEventDate, venueCode } from '@/lib/formatters';
import { findVenueBySlug } from '@/lib/db/queries/venue.queries';
import type { Event as DBEvent, EventPerformer, EventStack, Venue } from '@/types/database';
import { isSuccess } from '@/types/result';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { LineupArtist } from '@/components/dna/LineupText';
import PaginatedTimeline from '@/components/dna/PaginatedTimeline';
import GraphView from '@/components/graph/GraphView';
import DesktopOnly from '@/components/ui/DesktopOnly';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await findVenueBySlug(slug);

    if (!isSuccess(result)) {
        return { title: 'Venue Not Found' };
    }

    const venue = result.data;
    return {
        title: `${venue.name} - DJ Node Archive`,
        description: `${venue.name}의 이벤트 기록을 확인하세요. ${venue.city ? `위치: ${venue.city}` : ''}`,
    };
}

export const revalidate = 300;

function getLineupArtists(event: { lineup: unknown }): LineupArtist[] {
    if (!Array.isArray(event.lineup) || event.lineup.length === 0) return [];
    return event.lineup
        .filter((a: { name?: string }) => a.name)
        .map((a: { name?: string; artist_id?: string }) => ({
            name: a.name!,
            linked: !!a.artist_id,
        }));
}

function getUniqueArtists(events: DBEvent[]): number {
    const names = new Set<string>();
    for (const event of events) {
        if (Array.isArray(event.lineup)) {
            for (const performer of event.lineup as EventPerformer[]) {
                if (performer.name) names.add(performer.name.toLowerCase());
            }
        }
    }
    return names.size;
}

export default async function VenuePage({ params }: PageProps) {
    const { slug } = await params;

    const venueResult = await findVenueBySlug(slug);
    if (!isSuccess(venueResult)) {
        notFound();
    }

    const venue: Venue = venueResult.data;
    const [eventsResult, stacksResult] = await Promise.all([
        findEventsByVenueId(venue.id, 500),
        findStacksByVenueId(venue.id),
    ]);
    const allEvents: DBEvent[] = isSuccess(eventsResult) ? eventsResult.data : [];
    const stacks: EventStack[] = isSuccess(stacksResult) ? stacksResult.data : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = allEvents
        .filter((e) => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = allEvents.filter((e) => new Date(e.date) < today);

    const stackMap = new Map(stacks.map((s) => [s.id, s]));

    const uniqueArtists = getUniqueArtists(allEvents);
    const vcode = venueCode(venue.id);

    // Social/external links
    const links: { label: string; href: string }[] = [];
    if (venue.instagram) {
        links.push({
            label: 'Instagram',
            href: `https://instagram.com/${venue.instagram.replace('@', '')}`,
        });
    }
    if (venue.website) {
        links.push({ label: 'Website', href: venue.website });
    }
    if (venue.google_maps_url) {
        links.push({ label: 'Google Maps', href: venue.google_maps_url });
    }
    if (venue.external_sources?.ra_url) {
        links.push({ label: 'Resident Advisor', href: venue.external_sources.ra_url });
    }

    return (
        <DnaPageShell
            pathBar={{
                path: `root / discover / venues / ${venue.name.toLowerCase()}`,
                meta: `node: ${vcode} // type: venue`,
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // VENUE: ${venue.name.toUpperCase()} [${vcode}]`]}
            footerRight={venue.country || 'KR'}
        >
            {/* ── Venue Header ── */}
            <section className="pb-6 pt-6 md:pt-8">
                <NodeLabel right={vcode}>Venue Node</NodeLabel>

                <h1 className="dna-heading-page md:mt-2">{venue.name}</h1>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                    <span>{vcode}</span>
                    {venue.source === 'ra_import' && (
                        <>
                            <span className="text-dna-ink-ghost">/</span>
                            <span className="border border-dna-ink-faint px-1.5 py-px text-dna-system uppercase tracking-dna-system">
                                Source: RA
                            </span>
                        </>
                    )}
                </div>

                {/* Location */}
                {(venue.city || venue.address) && (
                    <div className="dna-text-body mt-3">
                        * {venue.address && <span>{venue.address}</span>}
                        {venue.address && venue.city && ', '}
                        {venue.city && <span>{venue.city}</span>}
                        {venue.city && venue.country && `, ${venue.country}`}
                    </div>
                )}

                {/* Links */}
                <ExternalLinks links={links} />
            </section>

            {/* ── Stats ── */}
            <StatsRow
                stats={[
                    { number: String(allEvents.length), label: 'Events' },
                    { number: String(upcomingEvents.length), label: 'Upcoming' },
                    { number: String(uniqueArtists), label: 'Artists' },
                    { number: venue.source === 'ra_import' ? 'RA' : 'USER', label: 'Source' },
                ]}
            />

            {/* ── Metadata ── */}
            <div className="grid grid-cols-1 gap-dna-gap md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Venue Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Name', value: venue.name },
                            { key: 'Alias', value: 'NULL' },
                            { key: 'Code', value: vcode },
                            { key: 'City', value: venue.city || 'NULL' },
                            { key: 'Country', value: venue.country || 'NULL' },
                            { key: 'Address', value: venue.address || 'NULL' },
                            { key: 'Source', value: venue.source || 'NULL' },
                        ]}
                    />
                </div>
                <div className="hidden md:block">
                    <SectionLabel right="SYS">External Links</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Instagram', value: venue.instagram || 'NULL' },
                            { key: 'Website', value: venue.website ? 'LINKED' : 'NULL' },
                            {
                                key: 'Google Maps',
                                value: venue.google_maps_url ? 'LINKED' : 'NULL',
                            },
                            {
                                key: 'Resident Advisor',
                                value: venue.external_sources?.ra_url ? 'LINKED' : 'NULL',
                            },
                        ]}
                    />
                </div>
            </div>

            {/* ── Graph View (desktop only) ── */}
            <DesktopOnly>
                <AsciiDivider text="GRAPH" />
                <section className="my-5">
                    <SectionLabel right="LOCAL">Connection Graph</SectionLabel>
                    <GraphView
                        centerId={venue.id}
                        centerType="venue"
                        className="h-[400px] w-full"
                    />
                </section>
            </DesktopOnly>

            {/* ── Upcoming Events ── */}
            {upcomingEvents.length > 0 && (
                <>
                    <AsciiDivider text="UPCOMING" />
                    <section className="my-5">
                        <SectionLabel right={`${upcomingEvents.length} UPCOMING`}>
                            Upcoming Events
                        </SectionLabel>
                        <PaginatedTimeline
                            entries={upcomingEvents.map((event) => {
                                const artists = getLineupArtists(event);
                                return {
                                    date: formatEventDate(event.date),
                                    title: event.title || formatEventDate(event.date),
                                    venue: venue.name,
                                    link: `/event/${event.id}`,
                                    artists,
                                };
                            })}
                        />
                    </section>
                </>
            )}

            {/* ── Event History ── */}
            <AsciiDivider text="EVENT HISTORY" />

            {pastEvents.length > 0 ? (
                <section className="my-5">
                    <SectionLabel right={`${pastEvents.length} EVENTS`}>Event History</SectionLabel>

                    <PaginatedTimeline
                        entries={pastEvents.map((event) => {
                            const artists = getLineupArtists(event);
                            const stack = event.stack_id ? stackMap.get(event.stack_id) : undefined;
                            return {
                                date: formatEventDate(event.date),
                                title: event.title || formatEventDate(event.date),
                                venue: venue.name,
                                link: `/event/${event.id}`,
                                stackLabel: stack?.title,
                                stackLink: stack ? `/events/series/${stack.id}` : undefined,
                                artists,
                            };
                        })}
                    />
                </section>
            ) : (
                <section className="my-5">
                    <SectionLabel right="0 EVENTS">Event History</SectionLabel>
                    <AsciiBox>
                        <p className="dna-text-body text-center">// NO EVENTS RECORDED</p>
                        <div className="mt-3 text-center">
                            <Link href="/login">
                                <Button>첫 번째 이벤트 등록하기</Button>
                            </Link>
                        </div>
                    </AsciiBox>
                </section>
            )}
        </DnaPageShell>
    );
}
