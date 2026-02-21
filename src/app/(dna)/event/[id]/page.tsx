import { findEventById } from '@/lib/db/queries/event.queries';
import { mapEventToDomain } from '@/lib/mappers';
import { isSuccess } from '@/types/result';
import type { Event } from '@/types/domain';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopNav } from '@/components/dna/TopNav';
import { PathBar } from '@/components/dna/PathBar';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { MetaTable } from '@/components/dna/MetaTable';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { AsciiBox } from '@/components/dna/AsciiBox';
import { Footer } from '@/components/dna/Footer';

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
        description: `${event.title} @ ${event.venue?.name || 'Unknown Venue'} — ${formatDate(event.date)}`,
    };
}

export const revalidate = 300;

function venueCode(id?: string): string {
    if (!id) return 'VN-0000';
    return `VN-${id.slice(0, 4).toUpperCase()}`;
}

function formatDate(dateStr: string): string {
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

export default async function EventPage({ params }: PageProps) {
    const { id } = await params;
    const result = await findEventById(id);

    if (!isSuccess(result)) {
        notFound();
    }

    const event: Event = mapEventToDomain(result.data);
    const vcode = venueCode(event.venue?.id);

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
                    path={`root / events / ${event.title.toLowerCase()}`}
                    meta={`type: event // ${formatDate(event.date)}`}
                />
            </div>

            {/* ── Poster ── */}
            <section className="pb-4 pt-6 md:pt-8">
                {event.posterUrl ? (
                    <div className="mx-auto w-full overflow-hidden border border-dna-ink-faint md:max-w-[480px]">
                        <img
                            src={event.posterUrl}
                            alt={event.title}
                            className="block w-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="mx-auto flex aspect-[3/4] w-full items-center justify-center border border-dna-ink-faint bg-dna-bg-dark md:max-w-[480px]">
                        <span className="text-dna-label uppercase tracking-dna-system text-dna-ink-ghost">
                            // NO POSTER
                        </span>
                    </div>
                )}
            </section>

            {/* ── Event Header ── */}
            <section className="pb-6">
                <div className="hidden items-center gap-2.5 text-dna-label uppercase tracking-dna-label text-dna-ink-light md:flex">
                    <span>Event Node</span>
                    <span className="h-0 flex-1 border-t border-dotted border-dna-ink-ghost" />
                    <span>{formatDate(event.date)}</span>
                </div>

                <h1 className="dna-heading-page md:mt-2">{event.title}</h1>

                <div className="mt-2 text-dna-meta-val tracking-dna-detail text-dna-ink-light">
                    <span className="md:hidden">{formatDate(event.date)}</span>
                    {event.venue?.name && (
                        <span className="mt-1 block md:mt-0 md:inline">
                            @{' '}
                            <span className="border-b border-dotted border-dna-accent-blue text-dna-accent-blue">
                                {event.venue.name} [{vcode}]
                            </span>
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
                            { key: 'Date', value: formatDate(event.date) },
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
                                value: event.posterUrl ? 'ATTACHED' : 'NULL',
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
                                    className="flex items-center gap-3 border-b border-dotted border-dna-ink-faint py-2.5 last:border-b-0"
                                >
                                    <span className="min-w-[24px] text-dna-label text-dna-ink-ghost">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span className="min-w-[32px] border border-dna-ink-faint px-[5px] py-0.5 text-center text-dna-system uppercase tracking-dna-system text-dna-ink-light">
                                        ART
                                    </span>
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
                        <p className="my-3 whitespace-pre-wrap text-dna-body leading-relaxed text-dna-ink-mid">
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

            {/* ── Footer ── */}
            <Footer
                meta={[`DJ-NODE-ARCHIVE // EVENT: ${event.title.toUpperCase()}`]}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: 'KR',
                }}
            />
        </div>
    );
}
