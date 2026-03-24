// src/components/dna/entry-renderers/entry-list-item.config.ts

import type { CustomEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';

import { formatHostname } from './shared';
import type { ListItemSpec } from './types';

export const listItemConfig = {
    event: {
        badge: 'EVT',
        linkTarget: 'detail',
        getDate: (e: EventEntry) => formatDateCompact(e.date),
        getSubtitle: (e: EventEntry) => e.venue?.name ?? null,
        getImage: (e: EventEntry) => e.imageUrls[0] ?? null,
        getArtists: (e: EventEntry) => (e.lineup?.length > 0 ? e.lineup : null),
    } satisfies ListItemSpec<EventEntry>,

    mixset: {
        badge: 'MIX',
        linkTarget: 'detail',
        getDate: (e: MixsetEntry) => (e.durationMinutes ? `${e.durationMinutes}min` : null),
        getImage: (e: MixsetEntry) => e.imageUrls[0] ?? null,
    } satisfies ListItemSpec<MixsetEntry>,

    link: {
        badge: 'LNK',
        linkTarget: 'external',
        getSubtitle: (e: LinkEntry) => formatHostname(e.url),
        getImage: (e: LinkEntry) => e.imageUrls[0] ?? null,
    } satisfies ListItemSpec<LinkEntry>,

    custom: {
        badge: 'BLK',
        linkTarget: 'detail',
    } satisfies ListItemSpec<CustomEntry>,
} as const;
