import { Globe, Instagram, Mail, Music, Youtube } from 'lucide-react';
import type { BadgeType } from '@/components/dna/TypeBadge';

/**
 * 링크 컴포넌트 아이콘 매핑
 * LinkEditor에서 사용
 */
export const LINK_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
};

/**
 * 엔트리 타입별 통합 설정
 * TreeItem, PageListView, CreateEntryPanel, EntryDetailView에서 사용
 */
export const ENTRY_TYPE_CONFIG = {
    event: {
        badgeType: 'EVT' as BadgeType,
        label: 'Event',
        titlePlaceholder: 'Enter event title',
    },
    mixset: {
        badgeType: 'MIX' as BadgeType,
        label: 'Mixset',
        titlePlaceholder: 'Enter mixset title',
    },
    link: {
        badgeType: 'LNK' as BadgeType,
        label: 'Link',
        titlePlaceholder: 'Enter link title',
    },
} as const;

export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
