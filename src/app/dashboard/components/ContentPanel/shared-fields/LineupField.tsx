'use client';

import { useCallback } from 'react';

import type { ArtistReference } from '@/types';
import { searchArtists } from '@/app/dashboard/services/search';
import type { TagOption } from '@/components/ui/SearchableTagInput';

import SearchableTagField from './SearchableTagField';
import type { FieldComponentProps } from './types';

interface LineupFieldProps extends FieldComponentProps<ArtistReference[]> {
    className?: string;
}

function toTagOptions(artists: ArtistReference[]): TagOption[] {
    return artists.map(({ id, name }) => ({ id, name }));
}

function toArtistRefs(tags: TagOption[]): ArtistReference[] {
    return tags.map(({ id, name }) => ({ id, name }));
}

export default function LineupField({
    value = [],
    onChange,
    disabled,
    className,
}: LineupFieldProps) {
    const handleChange = useCallback(
        (tags: TagOption[]) => onChange?.(toArtistRefs(tags)),
        [onChange]
    );

    return (
        <SearchableTagField
            value={toTagOptions(value)}
            onChange={handleChange}
            disabled={disabled}
            searchFn={searchArtists}
            placeholder="Search artists..."
            className={className}
        />
    );
}
