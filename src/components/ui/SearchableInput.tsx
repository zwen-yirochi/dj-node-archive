'use client';

import { cn } from '@/lib/utils';
import { Check, Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SearchOption {
    id?: string;
    name: string;
    subtitle?: string;
}

interface SearchableInputProps {
    value: SearchOption;
    onChange: (value: SearchOption) => void;
    searchFn: (query: string) => Promise<SearchOption[]>;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

export default function SearchableInput({
    value,
    onChange,
    searchFn,
    placeholder = 'Search...',
    className,
    debounceMs = 300,
}: SearchableInputProps) {
    const [inputValue, setInputValue] = useState(value.name);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<SearchOption[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync input value with prop
    useEffect(() => {
        setInputValue(value.name);
    }, [value.name]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Update parent with text value (no id)
        onChange({ name: newValue });

        // Debounced search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (newValue.trim().length >= 2) {
            setIsLoading(true);
            setIsOpen(true);

            debounceRef.current = setTimeout(async () => {
                try {
                    const results = await searchFn(newValue.trim());
                    setOptions(results);
                } catch {
                    setOptions([]);
                } finally {
                    setIsLoading(false);
                }
            }, debounceMs);
        } else {
            setOptions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (option: SearchOption) => {
        setInputValue(option.name);
        onChange(option);
        setIsOpen(false);
    };

    const handleFocus = () => {
        if (inputValue.trim().length >= 2 && options.length > 0) {
            setIsOpen(true);
        }
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={cn(
                        'w-full rounded-md border py-2 pl-9 pr-3 text-sm transition-colors',
                        'border-dashboard-border bg-dashboard-bg-muted text-dashboard-text',
                        'placeholder:text-dashboard-text-placeholder',
                        'focus:border-dashboard-border-hover focus:outline-none focus:ring-1 focus:ring-dashboard-border-hover'
                    )}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-dashboard-text-muted" />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-dashboard-border bg-dashboard-bg-card shadow-lg">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-dashboard-text-muted">
                            {isLoading
                                ? 'Searching...'
                                : 'No results found. Your input will be used as text.'}
                        </div>
                    ) : (
                        <ul className="py-1">
                            {options.map((option, index) => {
                                const isSelected =
                                    option.id === value.id && option.name === value.name;

                                return (
                                    <li key={option.id || index}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(option)}
                                            className={cn(
                                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                                                'hover:bg-dashboard-bg-hover',
                                                isSelected && 'bg-dashboard-bg-active'
                                            )}
                                        >
                                            <div className="flex-1">
                                                <p className="text-dashboard-text">{option.name}</p>
                                                {option.subtitle && (
                                                    <p className="text-xs text-dashboard-text-muted">
                                                        {option.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-dashboard-text" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
