import type { BadgeType } from '@/components/dna/TypeBadge';

import type { SectionKey } from '../stores/dashboardStore';
import type { EntryType } from './entryConfig';

export interface SidebarSectionConfig {
    section: SectionKey;
    title: string;
    badgeType: BadgeType;
    entryType: EntryType;
    emptyLabel: string;
}

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
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
];
