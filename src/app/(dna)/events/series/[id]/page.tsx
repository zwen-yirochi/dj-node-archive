import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { Event as DBEvent, EventPerformer } from '@/types/database';
import { isSuccess } from '@/types/result';
import { findStackById } from '@/lib/db/queries/event-stack.queries';
import { findEventsByStackId } from '@/lib/db/queries/event.queries';
import { findVenueById } from '@/lib/db/queries/venue.queries';
import { formatEventDate } from '@/lib/formatters';
import { AsciiBox } from '@/components/dna/AsciiBox';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import type { LineupArtist } from '@/components/dna/LineupText';
import { MetaTable } from '@/components/dna/MetaTable';
import { NodeLabel } from '@/components/dna/NodeLabel';
import PaginatedTimeline from '@/components/dna/PaginatedTimeline';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { StatsRow } from '@/components/dna/StatsRow';
import { VenueLink } from '@/components/dna/VenueLink';
import GraphView from '@/components/graph/GraphView';
import DesktopOnly from '@/components/ui/DesktopOnly';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const result = await findStackById(id);

    if (!isSuccess(result)) {
        return { title: 'Series Not Found' };
    }

    const stack = result.data;
    return {
        title: `${stack.title} - DJ Node Archive`,
        description: `${stack.title} 시리즈 이벤트 기록. ${stack.event_count}개의 이벤트.`,
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

export default async function StackSeriesPage({ params }: PageProps) {
    const { id } = await params;

    const stackResult = await findStackById(id);
    if (!isSuccess(stackResult)) {
        notFound();
    }

    const stack = stackResult.data;

    const [eventsResult, venueResult] = await Promise.all([
        findEventsByStackId(stack.id),
        findVenueById(stack.venue_id),
    ]);

    const events: DBEvent[] = isSuccess(eventsResult) ? eventsResult.data : [];
    const venue = isSuccess(venueResult) ? venueResult.data : null;
    const uniqueArtists = getUniqueArtists(events);

    return (
        <DnaPageShell
            pathBar={{
                items: [
                    { label: 'root', href: '/' },
                    { label: 'discover', href: '/discover' },
                    { label: 'series' },
                    { label: stack.title.toLowerCase() },
                ],
                meta: `type: event_stack // ${events.length} events`,
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // SERIES: ${stack.title.toUpperCase()}`]}
        >
            {/* ── Stack Header ── */}
            <section className="pb-6 pt-6 md:pt-8">
                <NodeLabel right="SERIES">Event Stack</NodeLabel>

                <h1 className="dna-heading-page md:mt-2">{stack.title}</h1>

                <div className="mt-1 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                    {venue && (
                        <span>
                            @{' '}
                            <VenueLink
                                name={venue.name}
                                venueId={venue.id}
                                href={`/venues/${venue.slug}`}
                            />
                        </span>
                    )}
                </div>
            </section>

            {/* ── Stats ── */}
            <StatsRow
                stats={[
                    { number: String(events.length), label: 'Events' },
                    { number: String(uniqueArtists), label: 'Artists' },
                    {
                        number: stack.first_event_date
                            ? new Date(stack.first_event_date).getFullYear().toString()
                            : '-',
                        label: 'First',
                    },
                    {
                        number: stack.last_event_date
                            ? new Date(stack.last_event_date).getFullYear().toString()
                            : '-',
                        label: 'Latest',
                    },
                ]}
            />

            {/* ── Metadata ── */}
            <div className="grid grid-cols-1 gap-dna-gap md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Series Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Title', value: stack.title },
                            { key: 'Venue', value: venue?.name || 'NULL' },
                            { key: 'Events', value: String(events.length) },
                            {
                                key: 'First Event',
                                value: stack.first_event_date
                                    ? formatEventDate(stack.first_event_date)
                                    : 'NULL',
                            },
                            {
                                key: 'Last Event',
                                value: stack.last_event_date
                                    ? formatEventDate(stack.last_event_date)
                                    : 'NULL',
                            },
                        ]}
                    />
                </div>
                <div className="hidden md:block">
                    <SectionLabel right="SYS">Stack Status</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Artists', value: String(uniqueArtists) },
                            { key: 'City', value: venue?.city || 'NULL' },
                            { key: 'Country', value: venue?.country || 'NULL' },
                            { key: 'Stack ID', value: stack.id.slice(0, 8).toUpperCase() },
                        ]}
                    />
                </div>
            </div>

            {/* ── Graph View (desktop only) ── */}
            {venue && (
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
            )}

            {/* ── Event Timeline ── */}
            <AsciiDivider text="EVENTS" />

            {events.length > 0 ? (
                <section className="my-5">
                    <SectionLabel right={`${events.length} EVENTS`}>Event Timeline</SectionLabel>

                    <PaginatedTimeline
                        entries={events.map((event) => {
                            const artists = getLineupArtists(event);
                            return {
                                date: formatEventDate(event.date),
                                title: event.title || formatEventDate(event.date),
                                venue: venue?.name || '',
                                link: `/event/${event.id}`,
                                artists,
                            };
                        })}
                    />
                </section>
            ) : (
                <section className="my-5">
                    <SectionLabel right="0 EVENTS">Event Timeline</SectionLabel>
                    <AsciiBox>
                        <p className="dna-text-body text-center">// NO EVENTS IN THIS SERIES</p>
                    </AsciiBox>
                </section>
            )}
        </DnaPageShell>
    );
}
