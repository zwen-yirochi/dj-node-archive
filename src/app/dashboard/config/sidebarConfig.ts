import type { BadgeType } from '@/components/dna/TypeBadge';

import type { SectionKey } from '../stores/dashboardStore';
import type { EntryType } from './entryConfig';

export interface ComponentGroupConfig {
    section: SectionKey;
    title: string;
    badgeType: BadgeType;
    entryType: EntryType;
    emptyLabel: string;
}

export const COMPONENT_GROUPS: ComponentGroupConfig[] = [
    {
        section: 'events',
        title: 'Events',
        badgeType: 'EVT',
        entryType: 'event',
        emptyLabel: 'event',
    },
    {
        section: 'mixsets',
        title: 'Mixsets',
        badgeType: 'MIX',
        entryType: 'mixset',
        emptyLabel: 'mixset',
    },
    { section: 'links', title: 'Links', badgeType: 'LNK', entryType: 'link', emptyLabel: 'link' },
    {
        section: 'custom',
        title: 'Custom',
        badgeType: 'BLK',
        entryType: 'custom',
        emptyLabel: 'custom entry',
    },
];
