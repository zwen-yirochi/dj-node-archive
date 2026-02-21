'use client';

import Link from 'next/link';
import { NodeItem } from '@/components/dna/NodeItem';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { useUnifiedSearch } from '@/hooks/use-search';
import type { SearchArtistItem, SearchVenueItem, SearchEventItem } from '@/types/search';

interface SearchResultsProps {
    query: string;
}

function ArtistSection({
    items,
    total_count,
    query,
}: {
    items: SearchArtistItem[];
    total_count: number;
    query: string;
}) {
    if (items.length === 0) return null;
    return (
        <div className="mb-6">
            <SectionLabel right={`${total_count} FOUND`}>Artists</SectionLabel>
            <div className="my-3">
                {items.map((artist, i) => (
                    <NodeItem
                        key={artist.id}
                        index={i + 1}
                        type="ART"
                        name={artist.display_name || artist.username}
                        detail={`@${artist.username}`}
                        href={artist.url}
                    />
                ))}
            </div>
            {total_count > items.length && (
                <Link
                    href={`/search/artists?q=${encodeURIComponent(query)}`}
                    className="dna-text-system block py-2 text-center text-dna-ink-light hover:text-dna-ink"
                >
                    // VIEW ALL {total_count} ARTISTS &rarr;
                </Link>
            )}
        </div>
    );
}

function VenueSection({
    items,
    total_count,
    query,
}: {
    items: SearchVenueItem[];
    total_count: number;
    query: string;
}) {
    if (items.length === 0) return null;
    return (
        <div className="mb-6">
            <SectionLabel right={`${total_count} FOUND`}>Venues</SectionLabel>
            <div className="my-3">
                {items.map((venue, i) => (
                    <NodeItem
                        key={venue.id}
                        index={i + 1}
                        type="VEN"
                        name={venue.name}
                        detail={
                            [
                                venue.city,
                                venue.event_count > 0 ? `${venue.event_count} events` : null,
                            ]
                                .filter(Boolean)
                                .join(' · ') || '—'
                        }
                        href={venue.url}
                    />
                ))}
            </div>
            {total_count > items.length && (
                <Link
                    href={`/search/venues?q=${encodeURIComponent(query)}`}
                    className="dna-text-system block py-2 text-center text-dna-ink-light hover:text-dna-ink"
                >
                    // VIEW ALL {total_count} VENUES &rarr;
                </Link>
            )}
        </div>
    );
}

function EventSection({
    items,
    total_count,
    query,
}: {
    items: SearchEventItem[];
    total_count: number;
    query: string;
}) {
    if (items.length === 0) return null;
    return (
        <div className="mb-6">
            <SectionLabel right={`${total_count} FOUND`}>Events</SectionLabel>
            <div className="my-3">
                {items.map((event, i) => (
                    <NodeItem
                        key={event.id}
                        index={i + 1}
                        type="EVT"
                        name={event.title}
                        detail={[event.date, event.venue_name].filter(Boolean).join(' · ') || '—'}
                        href={event.url}
                    />
                ))}
            </div>
            {total_count > items.length && (
                <Link
                    href={`/search/events?q=${encodeURIComponent(query)}`}
                    className="dna-text-system block py-2 text-center text-dna-ink-light hover:text-dna-ink"
                >
                    // VIEW ALL {total_count} EVENTS &rarr;
                </Link>
            )}
        </div>
    );
}

export function SearchResults({ query }: SearchResultsProps) {
    const { data, isLoading } = useUnifiedSearch(query);

    if (isLoading) {
        return <div className="dna-text-system py-12 text-center">// SCANNING...</div>;
    }

    if (!data) return null;

    const { artists, venues, events } = data.results;
    const hasResults =
        artists.items.length > 0 || venues.items.length > 0 || events.items.length > 0;

    if (!hasResults) {
        return (
            <div className="py-12 text-center text-dna-body text-dna-ink-light">
                // NO RESULTS FOUND
            </div>
        );
    }

    return (
        <div>
            <ArtistSection items={artists.items} total_count={artists.total_count} query={query} />
            <VenueSection items={venues.items} total_count={venues.total_count} query={query} />
            <EventSection items={events.items} total_count={events.total_count} query={query} />
        </div>
    );
}
