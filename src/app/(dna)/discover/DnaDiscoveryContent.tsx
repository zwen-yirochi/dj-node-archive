'use client';

import { useEffect, useState, useCallback } from 'react';
import { InputField } from '@/components/dna/InputField';
import { TagCluster } from '@/components/dna/TagCluster';
import { NodeItem } from '@/components/dna/NodeItem';
import { SectionLabel } from '@/components/dna/SectionLabel';
import type { DBVenueSearchResult } from '@/types/database';

const CITIES = ['All', 'Seoul', 'Busan', 'Daegu', 'Gwangju', 'Other'];

export interface DnaDiscoveryContentProps {
    initialVenues?: DBVenueSearchResult[];
}

export function DnaDiscoveryContent({ initialVenues = [] }: DnaDiscoveryContentProps) {
    const [venues, setVenues] = useState<DBVenueSearchResult[]>(initialVenues);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState('All');
    const [isLoading, setIsLoading] = useState(false);

    const fetchVenues = useCallback(async (query: string = '') => {
        setIsLoading(true);
        try {
            const url = query
                ? `/api/venues/search?q=${encodeURIComponent(query)}&limit=50`
                : '/api/venues?limit=50';
            const res = await fetch(url);
            const json = await res.json();

            const data = (json.data || []).map((v: DBVenueSearchResult) => ({
                ...v,
                event_count: v.event_count ?? 0,
            }));

            setVenues(data);
        } catch (err) {
            console.error('Failed to fetch venues:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialVenues.length === 0) {
            fetchVenues();
        }
    }, [initialVenues.length, fetchVenues]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVenues(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchVenues]);

    const filteredVenues = venues.filter((venue) => {
        if (selectedCity === 'All') return true;
        if (selectedCity === 'Other') {
            return !CITIES.slice(1, -1).includes(venue.city || '');
        }
        return venue.city === selectedCity;
    });

    return (
        <div>
            {/* Search */}
            <InputField
                label="Search Nodes"
                placeholder="베뉴 검색..."
                value={searchQuery}
                onChange={setSearchQuery}
            />

            {/* City Filter */}
            <TagCluster
                tags={CITIES.map((city) => ({
                    label: city,
                    active: selectedCity === city,
                }))}
                onTagClick={(label) => setSelectedCity(label)}
            />

            {/* Results */}
            <SectionLabel right={`${filteredVenues.length} NODES`}>Venue Index</SectionLabel>

            {isLoading ? (
                <div className="dna-text-system py-12 text-center">// SCANNING...</div>
            ) : filteredVenues.length > 0 ? (
                <div className="my-3">
                    {filteredVenues.map((venue, i) => (
                        <NodeItem
                            key={venue.id}
                            index={i + 1}
                            type="VEN"
                            name={venue.name}
                            detail={[venue.city, venue.country].filter(Boolean).join(', ') || '—'}
                            href={`/venues/${venue.slug}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-dna-body text-dna-ink-light">
                    // NO NODES FOUND — 다른 검색어나 필터를 시도해보세요
                </div>
            )}
        </div>
    );
}
