// src/components/dna/entry-renderers/shared.ts

import type { ContentEntry, ContentEntryType } from '@/types/domain';
import { getEntryHref } from '@/lib/utils/entry-link';
import type { BadgeType } from '@/components/dna/TypeBadge';

export const badgeMap: Record<ContentEntryType, BadgeType> = {
    event: 'EVT',
    mixset: 'MIX',
    link: 'LNK',
    custom: 'BLK',
};

export function formatHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

export function resolveHref(
    entry: ContentEntry,
    linkTarget: 'detail' | 'external',
    username: string
): string | undefined {
    if (linkTarget === 'external' && 'url' in entry) {
        return (entry as { url: string }).url;
    }
    return getEntryHref(entry, username) ?? undefined;
}
