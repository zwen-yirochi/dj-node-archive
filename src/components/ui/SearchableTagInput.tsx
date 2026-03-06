'use client';

import { useEffect, useRef, useState } from 'react';

import { Loader2, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface TagOption {
    id?: string;
    name: string;
    subtitle?: string;
}

interface TagSearchInputProps {
    value: TagOption[];
    onChange: (value: TagOption[]) => void;
    searchFn: (query: string) => Promise<TagOption[]>;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

export default function SearchableTagInput({
    value,
    onChange,
    searchFn,
    placeholder = 'Search and add...',
    className,
    debounceMs = 300,
}: TagSearchInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<TagOption[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
                    // Filter out already selected items
                    const filtered = results.filter(
                        (opt) => !value.some((v) => v.id === opt.id && v.name === opt.name)
                    );
                    setOptions(filtered);
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

    const handleSelect = (option: TagOption) => {
        // Add to tags if not already present
        if (!value.some((v) => v.id === option.id && v.name === option.name)) {
            onChange([...value, option]);
        }
        setInputValue('');
        setOptions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            // Add as text tag if input has value
            if (inputValue.trim()) {
                const newTag: TagOption = { name: inputValue.trim() };
                if (!value.some((v) => v.name === newTag.name)) {
                    onChange([...value, newTag]);
                }
                setInputValue('');
                setOptions([]);
                setIsOpen(false);
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            // Remove last tag on backspace when input is empty
            handleRemove(value.length - 1);
        }
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Tags + Input */}
            <div className={cn('flex flex-wrap gap-2 rounded-md border-b-0 p-2 transition-colors')}>
                {/* Tags */}
                {value.map((tag, index) => (
                    <span
                        key={tag.id || index}
                        className="flex items-center gap-1 rounded-full border border-dashboard-border bg-dashboard-bg-active px-2 py-0.5 text-xs text-dashboard-text"
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="ml-0.5 rounded-sm p-0.5 hover:bg-dashboard-bg-hover"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                {/* Input */}
                <div className="relative min-w-[120px] flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (inputValue.trim().length >= 2 && options.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                        placeholder={value.length === 0 ? placeholder : 'Add more...'}
                        className="w-full bg-transparent py-1 text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
                    />
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin self-center text-dashboard-text-muted" />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-dashboard-border bg-dashboard-bg-card shadow-lg">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-dashboard-text-muted">
                            {isLoading ? 'Searching...' : 'Press Enter to add as text'}
                        </div>
                    ) : (
                        <ul className="py-1">
                            {options.map((option, index) => (
                                <li key={option.id || index}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-dashboard-bg-hover"
                                    >
                                        <Search className="h-3 w-3 text-dashboard-text-muted" />
                                        <div className="flex-1">
                                            <p className="text-dashboard-text">{option.name}</p>
                                            {option.subtitle && (
                                                <p className="text-xs text-dashboard-text-muted">
                                                    {option.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
