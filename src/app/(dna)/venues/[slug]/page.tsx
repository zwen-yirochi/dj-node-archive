import { findEventsByVenueId } from '@/lib/db/queries/event.queries';
import { findVenueBySlug } from '@/lib/db/queries/venue.queries';
import { isSuccess } from '@/types/result';
import type { Venue, Event as DBEvent, EventPerformer } from '@/types/database';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopNav } from '@/components/dna/TopNav';
import { PathBar } from '@/components/dna/PathBar';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { StatsRow } from '@/components/dna/StatsRow';
import { MetaTable } from '@/components/dna/MetaTable';
import { AsciiBox } from '@/components/dna/AsciiBox';
import VenueTimeline from './VenueTimeline';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { Footer } from '@/components/dna/Footer';
import { Button } from '@/components/dna/Button';

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

function venueCode(id: string): string {
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

function getLineupText(event: { lineup: unknown; data: unknown }): string {
    const data = event.data as Record<string, unknown> | null;
    if (data?.lineup_text && typeof data.lineup_text === 'string') {
        return data.lineup_text;
    }
    if (Array.isArray(event.lineup) && event.lineup.length > 0) {
        return event.lineup
            .map((a: { name?: string }) => a.name)
            .filter(Boolean)
            .join(', ');
    }
    return '';
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
    const eventsResult = await findEventsByVenueId(venue.id, 500);
    const allEvents: DBEvent[] = isSuccess(eventsResult) ? eventsResult.data : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = allEvents
        .filter((e) => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = allEvents.filter((e) => new Date(e.date) < today);

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
        <div className="mx-auto max-w-dna px-4 md:px-dna-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover' },
                ]}
            />

            <div className="hidden md:block">
                <PathBar
                    path={`root / discover / venues / ${venue.name.toLowerCase()}`}
                    meta={`node: ${vcode} // type: venue`}
                />
            </div>

            {/* ── Venue Header ── */}
            <section className="pb-6 pt-6 md:pt-8">
                <div className="hidden items-center gap-2.5 text-dna-label uppercase tracking-dna-label text-dna-ink-light md:flex">
                    <span>Venue Node</span>
                    <span className="h-0 flex-1 border-t border-dotted border-dna-ink-ghost" />
                    <span>{vcode}</span>
                </div>

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
                    <div className="mt-3 text-dna-body text-dna-ink-mid">
                        * {venue.address && <span>{venue.address}</span>}
                        {venue.address && venue.city && ', '}
                        {venue.city && <span>{venue.city}</span>}
                        {venue.city && venue.country && `, ${venue.country}`}
                    </div>
                )}

                {/* Links */}
                {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 md:gap-5">
                        <span className="border-b border-dotted border-dna-ink-ghost pb-0.5 text-dna-label uppercase tracking-dna-btn text-dna-ink-light">
                            Links
                        </span>
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border-b border-dotted border-dna-ink-ghost pb-px text-dna-meta-val font-medium uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink hover:text-dna-ink"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
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

            {/* ── Upcoming Events ── */}
            {upcomingEvents.length > 0 && (
                <>
                    <AsciiDivider text="UPCOMING" />
                    <section className="my-5">
                        <SectionLabel right={`${upcomingEvents.length} UPCOMING`}>
                            Upcoming Events
                        </SectionLabel>
                        <VenueTimeline
                            entries={upcomingEvents.map((event) => {
                                const lineup = getLineupText(event);
                                return {
                                    date: formatEventDate(event.date),
                                    title: event.title || formatEventDate(event.date),
                                    venue: lineup || venue.name,
                                    link: `/event/${event.id}`,
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
                    <VenueTimeline
                        entries={pastEvents.map((event) => {
                            const lineup = getLineupText(event);
                            return {
                                date: formatEventDate(event.date),
                                title: event.title || formatEventDate(event.date),
                                venue: lineup || venue.name,
                                link: `/event/${event.id}`,
                            };
                        })}
                    />
                </section>
            ) : (
                <section className="my-5">
                    <SectionLabel right="0 EVENTS">Event History</SectionLabel>
                    <AsciiBox>
                        <p className="text-center text-dna-body text-dna-ink-mid">
                            // NO EVENTS RECORDED
                        </p>
                        <div className="mt-3 text-center">
                            <Link href="/login">
                                <Button>첫 번째 이벤트 등록하기</Button>
                            </Link>
                        </div>
                    </AsciiBox>
                </section>
            )}

            {/* ── Footer ── */}
            <Footer
                meta={[`DJ-NODE-ARCHIVE // VENUE: ${venue.name.toUpperCase()} [${vcode}]`]}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: venue.country || 'KR',
                }}
            />
        </div>
    );
}
