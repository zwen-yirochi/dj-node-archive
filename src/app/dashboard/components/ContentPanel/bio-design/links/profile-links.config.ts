import { FaBandcamp, FaInstagram, FaSoundcloud, FaSpotify } from 'react-icons/fa';
import { SiApplemusic } from 'react-icons/si';
import type { ComponentType, SVGProps } from 'react';

import { Link } from 'lucide-react';

import type { ProfileLinkType } from '@/types/domain';

export type PlatformIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export interface PlatformPreset {
    type: ProfileLinkType;
    label: string;
    placeholder: string;
    icon: PlatformIcon;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
    {
        type: 'instagram',
        label: 'Instagram',
        placeholder: 'https://instagram.com/...',
        icon: FaInstagram,
    },
    {
        type: 'bandcamp',
        label: 'Bandcamp',
        placeholder: 'https://__.bandcamp.com',
        icon: FaBandcamp,
    },
    {
        type: 'spotify',
        label: 'Spotify',
        placeholder: 'https://open.spotify.com/...',
        icon: FaSpotify,
    },
    {
        type: 'apple_music',
        label: 'Apple Music',
        placeholder: 'https://music.apple.com/...',
        icon: SiApplemusic,
    },
    {
        type: 'soundcloud',
        label: 'SoundCloud',
        placeholder: 'https://soundcloud.com/...',
        icon: FaSoundcloud,
    },
    { type: 'custom', label: 'Custom Link', placeholder: 'https://...', icon: Link },
];

export function getPlatformLabel(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.label ?? type;
}

export function getPlatformPlaceholder(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.placeholder ?? 'https://...';
}

export function getPlatformIcon(type: ProfileLinkType): PlatformIcon {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.icon ?? Link;
}
