import type { BadgeType } from '@/components/dna/TypeBadge';

import type { SectionKey } from '../../stores/dashboardStore';
import type { EntryType } from '../entry/entry-types';

export interface ComponentGroupConfig {
    section: SectionKey;
    title: string;
    badgeType: BadgeType;
    entryType: EntryType;
    emptyLabel: string;
}

/** Record 기반 — 새 EntryType 추가 시 누락하면 컴파일 에러 */
export const SIDEBAR_CONFIG: Record<EntryType, ComponentGroupConfig> = {
    event: {
        section: 'events',
        title: 'Events',
        badgeType: 'EVT',
        entryType: 'event',
        emptyLabel: 'event',
    },
    mixset: {
        section: 'mixsets',
        title: 'Mixsets',
        badgeType: 'MIX',
        entryType: 'mixset',
        emptyLabel: 'mixset',
    },
    link: {
        section: 'links',
        title: 'Links',
        badgeType: 'LNK',
        entryType: 'link',
        emptyLabel: 'link',
    },
    custom: {
        section: 'custom',
        title: 'Custom',
        badgeType: 'BLK',
        entryType: 'custom',
        emptyLabel: 'custom entry',
    },
};

/** 순서가 필요한 소비자용 배열 (SIDEBAR_CONFIG에서 파생) */
export const COMPONENT_GROUPS: ComponentGroupConfig[] = Object.values(SIDEBAR_CONFIG);
