// ==============================================
// constants/componentTypes.ts - 컴포넌트 타입 설정 중앙화
// ==============================================

import { Calendar, Headphones, Link, type LucideIcon } from 'lucide-react';
import type { ContentEntryType } from '@/types';

// ----------------------------------------------
// Component Type Configuration
// ----------------------------------------------

export interface ContentEntryTypeConfig {
    label: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    badgeColor: string;
}

export const COMPONENT_TYPE_CONFIG: Record<ContentEntryType, ContentEntryTypeConfig> = {
    event: {
        label: 'Event',
        icon: Calendar,
        color: 'text-dashboard-type-event',
        bgColor: 'bg-blue-50',
        badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    mixset: {
        label: 'Mixset',
        icon: Headphones,
        color: 'text-dashboard-type-mixset',
        bgColor: 'bg-purple-50',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    link: {
        label: 'Link',
        icon: Link,
        color: 'text-dashboard-type-link',
        bgColor: 'bg-green-50',
        badgeColor: 'bg-green-100 text-green-700 border-green-200',
    },
} as const;

// ----------------------------------------------
// Helper Functions
// ----------------------------------------------

export function getComponentConfig(type: ContentEntryType): ContentEntryTypeConfig {
    return COMPONENT_TYPE_CONFIG[type];
}

export function getComponentLabel(type: ContentEntryType): string {
    return COMPONENT_TYPE_CONFIG[type].label;
}

export function getComponentIcon(type: ContentEntryType): LucideIcon {
    return COMPONENT_TYPE_CONFIG[type].icon;
}

// ----------------------------------------------
// Icon Mapping (for LinkComponent icons)
// ----------------------------------------------

import { Music, Instagram, Youtube, Globe, Mail } from 'lucide-react';

export const LINK_ICON_MAP: Record<string, LucideIcon> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
} as const;

export function getLinkIcon(iconName: string): LucideIcon {
    return LINK_ICON_MAP[iconName] ?? Globe;
}
