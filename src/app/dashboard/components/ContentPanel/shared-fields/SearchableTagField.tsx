'use client';

import SearchableTagInput, { type TagOption } from '@/components/ui/SearchableTagInput';

import type { FieldComponentProps } from './types';

interface SearchableTagFieldProps extends FieldComponentProps<TagOption[]> {
    searchFn: (query: string) => Promise<TagOption[]>;
    placeholder?: string;
    className?: string;
}

export default function SearchableTagField({
    value = [],
    onChange,
    disabled,
    searchFn,
    placeholder = 'Search and add...',
    className,
}: SearchableTagFieldProps) {
    return (
        <SearchableTagInput
            value={value}
            onChange={(tags) => onChange?.(tags)}
            searchFn={searchFn}
            placeholder={placeholder}
            className={className}
        />
    );
}
