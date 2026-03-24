'use client';

import { useState } from 'react';

import { useArtistSearch, useEventSearch, useVenueSearch } from '@/hooks/use-search';
import { InputField } from '@/components/dna/InputField';
import { NodeItem } from '@/components/dna/NodeItem';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { TagCluster } from '@/components/dna/TagCluster';
import QueryProvider from '@/components/providers/QueryProvider';

import { SearchResults, type SearchFilter } from './SearchResults';

const DOMAINS: SearchFilter[] = ['All', 'Artists', 'Venues', 'Events'];

function BrowseResults({ filter }: { filter: SearchFilter }) {
    const showArtists = filter === 'All' || filter === 'Artists';
    const showVenues = filter === 'All' || filter === 'Venues';
    const showEvents = filter === 'All' || filter === 'Events';

    const artists = useArtistSearch('', 1, 50, showArtists);
    const venues = useVenueSearch('', 1, 50, showVenues);
    const events = useEventSearch('', 1, 50, showEvents);

    const isLoading =
        (showArtists && artists.isLoading) ||
        (showVenues && venues.isLoading) ||
        (showEvents && events.isLoading);

    if (isLoading) {
        return <div className="dna-text-system py-12 text-center">// SCANNING...</div>;
    }

    return (
        <div>
            {showArtists && artists.data && artists.data.items.length > 0 && (
                <div className="mb-6">
                    <SectionLabel right={`${artists.data.total_count} NODES`}>
                        Artist Index
                    </SectionLabel>
                    <div className="my-3">
                        {artists.data.items.map((artist, i) => (
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
                </div>
            )}

            {showVenues && venues.data && venues.data.items.length > 0 && (
                <div className="mb-6">
                    <SectionLabel right={`${venues.data.total_count} NODES`}>
                        Venue Index
                    </SectionLabel>
                    <div className="my-3">
                        {venues.data.items.map((venue, i) => (
                            <NodeItem
                                key={venue.id}
                                index={i + 1}
                                type="VEN"
                                name={venue.name}
                                detail={
                                    [
                                        venue.city,
                                        venue.event_count > 0
                                            ? `${venue.event_count} events`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || '—'
                                }
                                href={venue.url}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showEvents && events.data && events.data.items.length > 0 && (
                <div className="mb-6">
                    <SectionLabel right={`${events.data.total_count} NODES`}>
                        Event Index
                    </SectionLabel>
                    <div className="my-3">
                        {events.data.items.map((event, i) => (
                            <NodeItem
                                key={event.id}
                                index={i + 1}
                                type="EVT"
                                name={event.title}
                                detail={
                                    [event.date, event.venue_name].filter(Boolean).join(' · ') ||
                                    '—'
                                }
                                href={event.url}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function DnaDiscoveryContent() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<SearchFilter>('All');

    const isSearchActive = searchQuery.trim().length >= 2;

    return (
        <QueryProvider>
            <div>
                <InputField
                    label="Search Nodes"
                    placeholder="Search artists, venues, events..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />

                <TagCluster
                    tags={DOMAINS.map((domain) => ({
                        label: domain,
                        active: selectedDomain === domain,
                    }))}
                    onTagClick={(label) => setSelectedDomain(label as SearchFilter)}
                />

                {isSearchActive ? (
                    <SearchResults query={searchQuery} filter={selectedDomain} />
                ) : (
                    <BrowseResults filter={selectedDomain} />
                )}
            </div>
        </QueryProvider>
    );
}
