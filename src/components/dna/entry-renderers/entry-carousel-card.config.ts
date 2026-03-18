// src/components/dna/entry-renderers/entry-carousel-card.config.ts

import type { CustomEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';

import { formatHostname } from './shared';
import type { EntrySpec } from './types';

export const carouselCardConfig = {
    event: {
        badge: 'EVT',
        linkTarget: 'detail',
        getDate: (e: EventEntry) => formatDateCompact(e.date),
        getSubtitle: (e: EventEntry) => e.venue?.name ?? null,
        getImage: (e: EventEntry) => e.imageUrls[0] ?? null,
    } satisfies EntrySpec<EventEntry>,

    mixset: {
        badge: 'MIX',
        linkTarget: 'detail',
        getDate: (e: MixsetEntry) => (e.durationMinutes ? `${e.durationMinutes}min` : null),
        getImage: (e: MixsetEntry) => e.imageUrls[0] ?? null,
    } satisfies EntrySpec<MixsetEntry>,

    link: {
        badge: 'LNK',
        linkTarget: 'external',
        getSubtitle: (e: LinkEntry) => formatHostname(e.url),
        getImage: (e: LinkEntry) => e.imageUrls[0] ?? null,
    } satisfies EntrySpec<LinkEntry>,

    custom: {
        badge: 'BLK',
        linkTarget: 'detail',
    } satisfies EntrySpec<CustomEntry>,
} as const;
