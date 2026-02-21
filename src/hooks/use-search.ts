// hooks/use-search.ts
// TanStack Query 기반 검색 훅

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import type {
    UnifiedSearchResult,
    CategorySearchResult,
    SearchArtistItem,
    SearchVenueItem,
    SearchEventItem,
} from '@/types/search';

// ============================================
// Query Keys
// ============================================

export const searchKeys = {
    unified: (q: string) => ['search', 'unified', q] as const,
    artists: (q: string, page: number) => ['search', 'artists', q, page] as const,
    venues: (q: string, page: number) => ['search', 'venues', q, page] as const,
    events: (q: string, page: number) => ['search', 'events', q, page] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchUnifiedSearch(query: string): Promise<UnifiedSearchResult> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const json = await res.json();
    return json.data;
}

async function fetchCategorySearch<T>(
    category: string,
    query: string,
    page: number,
    limit: number
): Promise<CategorySearchResult<T>> {
    const res = await fetch(
        `/api/search/${category}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`Category search failed: ${res.status}`);
    const json = await res.json();
    return json.data;
}

// ============================================
// Debounce Hook
// ============================================

function useDebouncedValue(value: string, delay: number = 300): string {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// ============================================
// Hooks
// ============================================

export function useUnifiedSearch(query: string) {
    const debouncedQuery = useDebouncedValue(query);

    return useQuery({
        queryKey: searchKeys.unified(debouncedQuery),
        queryFn: () => fetchUnifiedSearch(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
        staleTime: 30_000,
    });
}

export function useArtistSearch(query: string, page: number = 1, limit: number = 20) {
    return useQuery({
        queryKey: searchKeys.artists(query, page),
        queryFn: () => fetchCategorySearch<SearchArtistItem>('artists', query, page, limit),
        enabled: query.length >= 2,
        staleTime: 30_000,
    });
}

export function useVenueSearch(query: string, page: number = 1, limit: number = 20) {
    return useQuery({
        queryKey: searchKeys.venues(query, page),
        queryFn: () => fetchCategorySearch<SearchVenueItem>('venues', query, page, limit),
        enabled: query.length >= 2,
        staleTime: 30_000,
    });
}

export function useEventSearch(query: string, page: number = 1, limit: number = 20) {
    return useQuery({
        queryKey: searchKeys.events(query, page),
        queryFn: () => fetchCategorySearch<SearchEventItem>('events', query, page, limit),
        enabled: query.length >= 2,
        staleTime: 30_000,
    });
}
