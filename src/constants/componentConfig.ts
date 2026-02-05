import {
    Calendar,
    Globe,
    Headphones,
    Instagram,
    Link as LinkIcon,
    Mail,
    Music,
    Youtube,
} from 'lucide-react';

/**
 * 링크 컴포넌트 아이콘 매핑
 * LinkEditor, ViewMode에서 사용
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
 * 컴포넌트 타입별 설정
 * TreeItem, PageListView, ViewMode에서 사용
 */
export const COMPONENT_TYPE_CONFIG = {
    event: {
        icon: Calendar,
        label: 'Event',
        color: 'text-dashboard-type-event',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    mixset: {
        icon: Headphones,
        label: 'Mixset',
        color: 'text-dashboard-type-mixset',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
    },
    link: {
        icon: LinkIcon,
        label: 'Link',
        color: 'text-dashboard-type-link',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
    },
} as const;

export type EntryType = keyof typeof COMPONENT_TYPE_CONFIG;

/** @deprecated Use EntryType instead */
export type ComponentType = EntryType;
