'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DBVenueSearchResult } from '@/types/database';

export interface VenueAutocompleteProps {
    value?: DBVenueSearchResult | null;
    onChange: (venue: DBVenueSearchResult | null) => void;
    onCreateNew?: (searchQuery: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function VenueAutocomplete({
    value,
    onChange,
    onCreateNew,
    placeholder = '베뉴 검색...',
    disabled = false,
    className,
}: VenueAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DBVenueSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `/api/venues/search?q=${encodeURIComponent(query)}&limit=10`
                );
                const json = await res.json();
                setResults(json.data || []);
                setIsOpen(true);
                setHighlightedIndex(-1);
            } catch (err) {
                console.error('Venue search failed:', err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(
        (venue: DBVenueSearchResult) => {
            onChange(venue);
            setQuery('');
            setIsOpen(false);
            setHighlightedIndex(-1);
        },
        [onChange]
    );

    const handleCreateNew = useCallback(() => {
        if (onCreateNew && query.trim()) {
            onCreateNew(query.trim());
            setIsOpen(false);
        }
    }, [onCreateNew, query]);

    const handleClear = useCallback(() => {
        onChange(null);
        setQuery('');
        inputRef.current?.focus();
    }, [onChange]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen) return;

            const totalItems = results.length + (onCreateNew ? 1 : 0);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                        handleSelect(results[highlightedIndex]);
                    } else if (highlightedIndex === results.length && onCreateNew) {
                        handleCreateNew();
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    break;
            }
        },
        [isOpen, results, highlightedIndex, handleSelect, handleCreateNew, onCreateNew]
    );

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    // If a value is selected, show it
    if (value) {
        return (
            <div className={cn('relative', className)}>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">
                        {value.name}
                        {value.city && (
                            <span className="ml-1 text-muted-foreground">· {value.city}</span>
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 1 && results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-9 pr-9"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && (results.length > 0 || onCreateNew) && (
                <ul
                    ref={listRef}
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg"
                    role="listbox"
                >
                    {results.map((venue, index) => (
                        <li
                            key={venue.id}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                                highlightedIndex === index
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                            )}
                            onClick={() => handleSelect(venue)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="font-medium">{venue.name}</div>
                                {venue.city && (
                                    <div className="text-xs text-muted-foreground">
                                        {venue.city}
                                    </div>
                                )}
                            </div>
                            {venue.event_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {venue.event_count}개 이벤트
                                </span>
                            )}
                        </li>
                    ))}

                    {onCreateNew && (
                        <li
                            role="option"
                            aria-selected={highlightedIndex === results.length}
                            className={cn(
                                'mt-1 flex cursor-pointer items-center gap-2 rounded-sm border-t px-2 py-1.5 pt-2 text-sm',
                                highlightedIndex === results.length
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                            )}
                            onClick={handleCreateNew}
                            onMouseEnter={() => setHighlightedIndex(results.length)}
                        >
                            <Plus className="h-4 w-4" />
                            <span>&quot;{query}&quot; 새 베뉴로 추가</span>
                        </li>
                    )}

                    {results.length === 0 && !onCreateNew && (
                        <li className="px-2 py-1.5 text-sm text-muted-foreground">
                            검색 결과가 없습니다
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
