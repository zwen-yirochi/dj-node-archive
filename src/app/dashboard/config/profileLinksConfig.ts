import type { ProfileLinkType } from '@/types/domain';

export interface PlatformPreset {
    type: ProfileLinkType;
    label: string;
    placeholder: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
    { type: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { type: 'bandcamp', label: 'Bandcamp', placeholder: 'https://__.bandcamp.com' },
    { type: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
    { type: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
    { type: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
    { type: 'region', label: 'Region', placeholder: 'URL' },
    { type: 'custom', label: 'Custom Link', placeholder: 'https://...' },
];

export function getPlatformLabel(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.label ?? type;
}

export function getPlatformPlaceholder(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.placeholder ?? 'https://...';
}
