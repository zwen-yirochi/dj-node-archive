'use client';

import { useCallback } from 'react';

import { Loader2, MapPin, X } from 'lucide-react';

import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { useScrollIntoView } from '@/hooks/ui/useScrollIntoView';

import { useVenueSearch, type SearchResult } from './hooks/useVenueSearch';
import type { FieldComponentProps } from './types';

type VenueValue = { id?: string; name: string };

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
    const {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
    } = useVenueSearch();

    const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
    const listRef = useScrollIntoView<HTMLUListElement>(highlightedIndex);

    const handleSelect = useCallback(
        (result: SearchResult) => {
            onChange?.({ id: result.id, name: result.name });
            setQuery('');
            setIsOpen(false);
            setHighlightedIndex(-1);
        },
        [onChange, setQuery, setIsOpen, setHighlightedIndex]
    );

    const handleClear = useCallback(() => {
        onChange?.({ name: '' });
        setQuery('');
    }, [onChange, setQuery]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen || results.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(
                        highlightedIndex < results.length - 1 ? highlightedIndex + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(
                        highlightedIndex > 0 ? highlightedIndex - 1 : results.length - 1
                    );
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
        [isOpen, results, highlightedIndex, handleSelect, setIsOpen, setHighlightedIndex]
    );

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

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <input
                type="text"
                value={query || value.name}
                onChange={(e) => {
                    const v = e.target.value;
                    setQuery(v);
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
