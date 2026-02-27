'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditorData, useEntryMutations } from '../../hooks';
import { toast } from '@/hooks/use-toast';
import { mapEventToEntry } from '@/lib/mappers';
import { selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import type { DBEventWithVenue } from '@/types/database';
import { Calendar, Loader2, MapPin, Search } from 'lucide-react';
import { useState } from 'react';

interface EventSearchResult {
    id: string;
    title: string;
    date: string;
    venue: { name: string };
    poster_url?: string;
}

export default function EventImportSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EventSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isImporting, setIsImporting] = useState<string | null>(null);

    // TanStack Query
    const { data } = useEditorData();
    const { create: createEntryMutation } = useEntryMutations();

    // Store
    const setView = useDashboardStore(selectSetView);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            // 현재 사용자의 이벤트 검색 (API가 인증된 사용자의 이벤트를 반환)
            const res = await fetch(`/api/events?limit=20`);
            if (!res.ok) throw new Error('Search failed');

            const events = await res.json();
            // 클라이언트 측에서 제목 필터링
            const filtered = events.filter((e: EventSearchResult) =>
                e.title?.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } catch {
            toast({
                variant: 'destructive',
                title: 'Search failed',
                description: 'Failed to search events.',
            });
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleImport = async (event: EventSearchResult) => {
        if (!data.pageId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Page ID is not set. Please refresh the page.',
            });
            return;
        }

        setIsImporting(event.id);
        try {
            // 이벤트 상세 정보 가져오기
            const res = await fetch(`/api/events/${event.id}`);
            if (!res.ok) throw new Error('Failed to fetch event');

            const eventData: DBEventWithVenue = await res.json();

            // Entry로 변환
            const newEntry = mapEventToEntry(eventData);

            await createEntryMutation.mutateAsync({
                pageId: data.pageId,
                entry: newEntry,
            });
            setView({ kind: 'detail', entryId: newEntry.id });

            toast({
                title: 'Event imported',
                description: `"${event.title}" has been imported.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Import failed',
                description: 'Failed to import event.',
            });
        } finally {
            setIsImporting(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search your events..."
                        className="border-dashboard-border bg-dashboard-bg-muted pl-9 text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    variant="outline"
                    className="shrink-0 border-dashboard-border text-dashboard-text-secondary hover:bg-dashboard-bg-muted"
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
            </div>

            {/* Results */}
            {results.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs text-dashboard-text-muted">
                        {results.length} event{results.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                        {results.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-3 rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-3 transition-colors hover:border-dashboard-border-hover"
                            >
                                {/* Poster thumbnail */}
                                {event.poster_url ? (
                                    <img
                                        src={event.poster_url}
                                        alt=""
                                        className="h-16 w-12 rounded object-cover"
                                    />
                                ) : (
                                    <div className="flex h-16 w-12 items-center justify-center rounded bg-dashboard-bg-active">
                                        <Calendar className="h-5 w-5 text-dashboard-text-muted" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-dashboard-text">
                                        {event.title || 'Untitled Event'}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-dashboard-text-muted">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                        {event.venue?.name && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {event.venue.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Import button */}
                                <Button
                                    onClick={() => handleImport(event)}
                                    disabled={isImporting === event.id}
                                    size="sm"
                                    className="shrink-0 bg-dashboard-text text-white hover:bg-dashboard-text/90"
                                >
                                    {isImporting === event.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Import'
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : query && !isSearching ? (
                <p className="py-8 text-center text-sm text-dashboard-text-muted">
                    No events found. Try a different search term.
                </p>
            ) : (
                <p className="py-8 text-center text-sm text-dashboard-text-muted">
                    Search for your existing events to import them as entries.
                </p>
            )}
        </div>
    );
}
