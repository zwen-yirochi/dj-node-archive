'use client';

import { useCallback } from 'react';

import { Users } from 'lucide-react';

import type { ArtistReference } from '@/types';

import TagListField, { type TagItem } from './TagListField';
import type { FieldComponentProps } from './types';

interface LineupFieldProps extends FieldComponentProps<ArtistReference[]> {
    className?: string;
}

const formatArtistTag = (name: string) => (name.startsWith('@') ? name : `@${name}`);

function toTagItems(artists: ArtistReference[]): TagItem[] {
    return artists.map(({ id, name }) => ({ id, name }));
}

function toArtistRefs(tags: TagItem[]): ArtistReference[] {
    return tags.map(({ id, name }) => ({ id, name }));
}

export default function LineupField({ value, onChange, disabled, className }: LineupFieldProps) {
    const handleChange = useCallback((tags: TagItem[]) => onChange(toArtistRefs(tags)), [onChange]);

    return (
        <div className={`flex items-start gap-3 text-sm ${className ?? ''}`}>
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <TagListField
                value={toTagItems(value)}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Tag artists with @username"
                formatNewTag={formatArtistTag}
            />
        </div>
    );
}
