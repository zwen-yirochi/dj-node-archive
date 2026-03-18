// src/components/dna/entry-renderers/types.ts

import type { ContentEntry } from '@/types/domain';
import type { BadgeType } from '@/components/dna/TypeBadge';

export interface EntrySpec<T extends ContentEntry = ContentEntry> {
    badge: BadgeType;
    linkTarget: 'detail' | 'external';
    getDate?: (entry: T) => string | null;
    getSubtitle?: (entry: T) => string | null;
    getImage?: (entry: T) => string | null;
}

export interface ListItemSpec<T extends ContentEntry = ContentEntry> extends EntrySpec<T> {
    getArtists?: (entry: T) => { name: string }[] | null;
}
