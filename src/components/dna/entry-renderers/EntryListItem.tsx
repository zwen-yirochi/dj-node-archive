// src/components/dna/entry-renderers/EntryListItem.tsx

import type { ContentEntry } from '@/types/domain';
import type { TimelineEntry } from '@/components/dna/Timeline';

import { listItemConfig } from './entry-list-item.config';
import { resolveHref } from './shared';
import type { ListItemSpec } from './types';

export function toEntryTimelineData(entry: ContentEntry, username: string): TimelineEntry {
    const spec = listItemConfig[entry.type] as ListItemSpec;
    const date = spec.getDate?.(entry as never) ?? null;
    const subtitle = spec.getSubtitle?.(entry as never) ?? null;

    // event 타입만 @ 접두사 표시
    const showAtPrefix = entry.type === 'event';

    return {
        date: date ?? '',
        title: entry.title || 'Untitled',
        venue: subtitle ?? '',
        link: resolveHref(entry, spec.linkTarget, username),
        imageUrl: spec.getImage?.(entry as never) ?? undefined,
        artists: spec.getArtists?.(entry as never) ?? undefined,
        showAtPrefix,
    };
}
