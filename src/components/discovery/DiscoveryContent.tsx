'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VenueCard } from '@/components/venue/VenueCard';
import type { DBVenueSearchResult } from '@/types/database';

const CITIES = ['All', 'Seoul', 'Busan', 'Daegu', 'Gwangju', 'Other'];

export interface DiscoveryContentProps {
    initialVenues?: DBVenueSearchResult[];
}

export function DiscoveryContent({ initialVenues = [] }: DiscoveryContentProps) {
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

            // Convert to DBVenueSearchResult format if needed
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

    // Initial load
    useEffect(() => {
        if (initialVenues.length === 0) {
            fetchVenues();
        }
    }, [initialVenues.length, fetchVenues]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVenues(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchVenues]);

    // Filter by city
    const filteredVenues = venues.filter((venue) => {
        if (selectedCity === 'All') return true;
        if (selectedCity === 'Other') {
            return !CITIES.slice(1, -1).includes(venue.city || '');
        }
        return venue.city === selectedCity;
    });

    return (
        <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="베뉴 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* City Filter */}
                <div className="flex flex-wrap gap-2">
                    {CITIES.map((city) => (
                        <Button
                            key={city}
                            variant={selectedCity === city ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCity(city)}
                            className="h-8"
                        >
                            {city === 'All' && <MapPin className="mr-1 h-3 w-3" />}
                            {city}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredVenues.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredVenues.map((venue) => (
                        <VenueCard key={venue.id} venue={venue} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">
                        검색 결과가 없습니다
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        다른 검색어나 필터를 시도해보세요
                    </p>
                </div>
            )}

            {/* Stats */}
            {!isLoading && filteredVenues.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                    총 {filteredVenues.length}개 베뉴
                </div>
            )}
        </div>
    );
}
