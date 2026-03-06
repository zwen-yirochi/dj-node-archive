import type { BadgeType } from '@/components/dna/TypeBadge';

/**
 * Unified configuration per entry type
 * Used by TreeItem, PageListView, CreateEntryPanel, CommandPalette, and EntryDetailView
 */
export const ENTRY_TYPE_CONFIG = {
    event: {
        badgeType: 'EVT' as BadgeType,
        label: 'Event',
        titlePlaceholder: 'Enter event title',
        hasDetailPage: true,
    },
    mixset: {
        badgeType: 'MIX' as BadgeType,
        label: 'Mixset',
        titlePlaceholder: 'Enter mixset title',
        hasDetailPage: true,
    },
    link: {
        badgeType: 'LNK' as BadgeType,
        label: 'Link',
        titlePlaceholder: 'Enter link title',
        hasDetailPage: false,
    },
    custom: {
        badgeType: 'BLK' as BadgeType,
        label: 'Custom',
        titlePlaceholder: 'Enter custom entry title',
        hasDetailPage: true,
    },
} as const;

export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
