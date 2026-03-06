import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { Event } from '@/types/domain';
import { isSuccess } from '@/types/result';
import { findEventById } from '@/lib/db/queries/event.queries';
import { formatEventDate, venueCode } from '@/lib/formatters';
import { mapEventToDomain } from '@/lib/mappers';
import { AsciiBox } from '@/components/dna/AsciiBox';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { ImageFrame } from '@/components/dna/ImageFrame';
import { MetaTable } from '@/components/dna/MetaTable';
import { NodeLabel } from '@/components/dna/NodeLabel';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { TypeBadge } from '@/components/dna/TypeBadge';
import { VenueLink } from '@/components/dna/VenueLink';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const result = await findEventById(id);

    if (!isSuccess(result)) {
        return { title: 'Event Not Found' };
    }

    const event = mapEventToDomain(result.data);
    return {
        title: `${event.title} - DJ Node Archive`,
        description: `${event.title} @ ${event.venue?.name || 'Unknown Venue'} — ${formatEventDate(event.date)}`,
    };
}

export const revalidate = 300;

export default async function EventPage({ params }: PageProps) {
    const { id } = await params;
    const result = await findEventById(id);

    if (!isSuccess(result)) {
        notFound();
    }

    const event: Event = mapEventToDomain(result.data);
    const vcode = venueCode(event.venue?.id);

    return (
        <DnaPageShell
            pathBar={{
                path: `root / events / ${event.title.toLowerCase()}`,
                meta: `type: event // ${formatEventDate(event.date)}`,
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // EVENT: ${event.title.toUpperCase()}`]}
        >
            {/* ── Poster ── */}
            <section className="pb-4 pt-6 md:pt-8">
                {event.imageUrls?.[0] ? (
                    <div className="mx-auto w-full md:max-w-[480px]">
                        <ImageFrame
                            src={event.imageUrls[0]}
                            alt={event.title}
                            className="aspect-[3/4]"
                            priority
                        />
                    </div>
                ) : (
                    <div className="mx-auto flex aspect-[3/4] w-full items-center justify-center border border-dna-ink-faint bg-dna-bg-dark md:max-w-[480px]">
                        <span className="dna-text-system">// NO POSTER</span>
                    </div>
                )}
            </section>

            {/* ── Event Header ── */}
            <section className="pb-6">
                <NodeLabel right={formatEventDate(event.date)}>Event Node</NodeLabel>

                <h1 className="dna-heading-page md:mt-2">{event.title}</h1>

                <div className="mt-2 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                    <span className="md:hidden">{formatEventDate(event.date)}</span>
                    {event.venue?.name && (
                        <span className="mt-1 block md:mt-0 md:inline">
                            @ <VenueLink name={event.venue.name} venueId={event.venue.id} />
                        </span>
                    )}
                </div>
            </section>

            {/* ── Metadata ── */}
            <div className="grid grid-cols-1 gap-dna-gap md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Event Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Title', value: event.title },
                            { key: 'Date', value: formatEventDate(event.date) },
                            { key: 'Venue', value: event.venue?.name || 'NULL' },
                            { key: 'Venue Code', value: vcode },
                            { key: 'Lineup', value: String(event.lineup.length) + ' artists' },
                            { key: 'Source', value: event.source || 'USER' },
                        ]}
                    />
                </div>
                <div className="hidden md:block">
                    <SectionLabel right="SYS">Archive Status</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Public', value: event.isPublic ? 'YES' : 'NO' },
                            {
                                key: 'Poster',
                                value: event.imageUrls?.length ? 'ATTACHED' : 'NULL',
                            },
                            {
                                key: 'Description',
                                value: event.description ? 'ATTACHED' : 'NULL',
                            },
                            {
                                key: 'Links',
                                value: event.links?.length ? String(event.links.length) : '0',
                            },
                        ]}
                    />
                </div>
            </div>

            {/* ── Lineup ── */}
            {event.lineup.length > 0 && (
                <>
                    <AsciiDivider text="LINEUP" />
                    <section className="my-5">
                        <SectionLabel right={`${event.lineup.length} ARTISTS`}>Lineup</SectionLabel>
                        <div className="my-3">
                            {event.lineup.map((artist, i) => (
                                <div
                                    key={i}
                                    className="dna-border-row flex items-center gap-3 border-b py-2.5 last:border-b-0"
                                >
                                    <span className="min-w-[24px] text-dna-label text-dna-ink-ghost">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <TypeBadge type="ART" />
                                    <span className="flex-1 text-dna-body font-medium uppercase">
                                        {artist.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* ── Description ── */}
            {event.description && (
                <>
                    <AsciiDivider text="DESCRIPTION" />
                    <section className="my-5">
                        <SectionLabel>Description</SectionLabel>
                        <p className="dna-text-body my-3 whitespace-pre-wrap leading-relaxed">
                            {event.description}
                        </p>
                    </section>
                </>
            )}

            {/* ── External Links ── */}
            {event.links && event.links.length > 0 && (
                <>
                    <AsciiDivider text="LINKS" />
                    <section className="my-5">
                        <SectionLabel right={`${event.links.length} LINKS`}>
                            External Links
                        </SectionLabel>
                        <div className="my-3 flex flex-col gap-2">
                            {event.links.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between border border-dna-ink-faint px-4 py-3 text-dna-meta-val uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink-light hover:text-dna-ink"
                                >
                                    <span>{link.title}</span>
                                    <span className="text-dna-ink-ghost">&rarr;</span>
                                </a>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </DnaPageShell>
    );
}
