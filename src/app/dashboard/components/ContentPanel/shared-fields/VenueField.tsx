'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Loader2, MapPin, X } from 'lucide-react';

import { searchVenues } from '@/app/dashboard/services/search';

import type { FieldComponentProps } from './types';

type VenueValue = { id?: string; name: string };
type SearchResult = { id: string; name: string; subtitle?: string };

/** SearchOption(id optional) → SearchResult(id required) 필터 */
function toSearchResults(
    options: { id?: string; name: string; subtitle?: string }[]
): SearchResult[] {
    return options.filter((o): o is SearchResult => !!o.id);
}

interface VenueFieldProps extends FieldComponentProps<VenueValue> {
    placeholder?: string;
    className?: string;
}

export default function VenueField({
    value = { name: '' },
    onChange,
    disabled,
    placeholder = 'Search venue...',
    className,
}: VenueFieldProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

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
                const data = await searchVenues(query);
                setResults(toSearchResults(data));
                setIsOpen(true);
                setHighlightedIndex(-1);
            } catch {
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

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    const handleSelect = useCallback(
        (result: SearchResult) => {
            onChange?.({ id: result.id, name: result.name });
            setQuery('');
            setIsOpen(false);
            setHighlightedIndex(-1);
        },
        [onChange]
    );

    const handleClear = useCallback(() => {
        onChange?.({ name: '' });
        setQuery('');
        inputRef.current?.focus();
    }, [onChange]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen || results.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                        handleSelect(results[highlightedIndex]);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    break;
            }
        },
        [isOpen, results, highlightedIndex, handleSelect]
    );

    // Selected venue with id — show read-only chip
    if (value.id && value.name) {
        return (
            <div className={className}>
                <div className="flex items-center gap-2 rounded-md border border-dashboard-border bg-dashboard-bg-muted px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                    <span className="flex-1 text-sm text-dashboard-text">{value.name}</span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-dashboard-text-placeholder transition-colors hover:text-dashboard-text"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // No selection — search input with free-text fallback
    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <input
                ref={inputRef}
                type="text"
                value={query || value.name}
                onChange={(e) => {
                    const v = e.target.value;
                    setQuery(v);
                    // Free-text: update name without id
                    onChange?.({ name: v });
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 1 && results.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-transparent text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
            />

            {isLoading && (
                <Loader2 className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-dashboard-text-placeholder" />
            )}

            {isOpen && results.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-dashboard-border bg-dashboard-bg-card p-1 shadow-lg"
                    role="listbox"
                >
                    {results.map((result, index) => (
                        <li
                            key={result.id}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                                highlightedIndex === index
                                    ? 'bg-dashboard-bg-hover text-dashboard-text'
                                    : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                            }`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                            <div className="flex-1">
                                <span>{result.name}</span>
                                {result.subtitle && (
                                    <span className="ml-1 text-xs text-dashboard-text-placeholder">
                                        · {result.subtitle}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
