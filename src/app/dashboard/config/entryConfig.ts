import { Blocks, Calendar, Link2, Music, type LucideIcon } from 'lucide-react';

import type { BadgeType } from '@/components/dna/TypeBadge';

/**
 * Unified configuration per entry type
 * Used by TreeItem, PageListView, CreateEntryPanel, CommandPalette, and EntryDetailView
 */
export const ENTRY_TYPE_CONFIG = {
    event: {
        badgeType: 'EVT' as BadgeType,
        label: 'Event',
        icon: Calendar as LucideIcon,
        titlePlaceholder: 'Enter event title',
    },
    mixset: {
        badgeType: 'MIX' as BadgeType,
        label: 'Mixset',
        icon: Music as LucideIcon,
        titlePlaceholder: 'Enter mixset title',
    },
    link: {
        badgeType: 'LNK' as BadgeType,
        label: 'Link',
        icon: Link2 as LucideIcon,
        titlePlaceholder: 'Enter link title',
    },
    custom: {
        badgeType: 'BLK' as BadgeType,
        label: 'Custom',
        icon: Blocks as LucideIcon,
        titlePlaceholder: 'Enter custom entry title',
    },
} as const;

export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
