'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { searchVenues } from '@/app/dashboard/services/search';

export type SearchResult = { id: string; name: string; subtitle?: string };

interface UseVenueSearchOptions {
    debounceMs?: number;
}

interface UseVenueSearchReturn {
    query: string;
    setQuery: (q: string) => void;
    results: SearchResult[];
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    highlightedIndex: number;
    setHighlightedIndex: (index: number) => void;
    retry: () => void;
}

function toSearchResults(
    options: { id?: string; name: string; subtitle?: string }[]
): SearchResult[] {
    return options.filter((o): o is SearchResult => !!o.id);
}

export function useVenueSearch({
    debounceMs = 300,
}: UseVenueSearchOptions = {}): UseVenueSearchReturn {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [retryCount, setRetryCount] = useState(0);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoading(true);
            try {
                const data = await searchVenues(query);
                if (!controller.signal.aborted) {
                    setResults(toSearchResults(data));
                    setIsOpen(true);
                    setHighlightedIndex(-1);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, debounceMs);

        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [query, debounceMs, retryCount]);

    const retry = useCallback(() => {
        setRetryCount((c) => c + 1);
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
        retry,
    };
}
