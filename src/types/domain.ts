// ==============================================
// types/domain.ts - 핵심 도메인 타입 (단일 소스)
// ==============================================

// ----------------------------------------------
// User
// ----------------------------------------------
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
}

// ----------------------------------------------
// Theme
// ----------------------------------------------
export type AccentColor = 'pink' | 'cyan' | 'purple';
export type BackgroundStyle = 'gradient' | 'solid' | 'image';

export interface Theme {
    accentColor: AccentColor;
    backgroundStyle: BackgroundStyle;
    backgroundImage?: string;
}

export interface ThemePreset {
    id: string;
    name: string;
    accentColor: AccentColor;
    backgroundColor: string;
    previewGradient: string;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'neon-pink',
        name: 'Neon Pink',
        accentColor: 'pink',
        backgroundColor: '#0a0a0b',
        previewGradient: 'linear-gradient(135deg, #ff2d92 0%, #a855f7 100%)',
    },
    {
        id: 'cyber-cyan',
        name: 'Cyber Cyan',
        accentColor: 'cyan',
        backgroundColor: '#0a0a0b',
        previewGradient: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)',
    },
    {
        id: 'purple-haze',
        name: 'Purple Haze',
        accentColor: 'purple',
        backgroundColor: '#0a0a0b',
        previewGradient: 'linear-gradient(135deg, #a855f7 0%, #ff2d92 100%)',
    },
];

// ----------------------------------------------
// Components (Discriminated Union)
// ----------------------------------------------
export interface EventComponent {
    id: string;
    type: 'show';
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    lineup: string[];
    description: string;
    links?: { title: string; url: string }[];
    // 원본 이벤트 연결 (이벤트 import 시)
    eventId?: string;
    venueId?: string;
}

export interface MixsetComponent {
    id: string;
    type: 'mixset';
    title: string;
    coverUrl: string;
    audioUrl: string;
    soundcloudEmbedUrl?: string;
    tracklist: { track: string; artist: string; time: string }[];
    description: string;
    releaseDate: string;
    genre: string;
}

export interface LinkComponent {
    id: string;
    type: 'link';
    title: string;
    url: string;
    icon: string;
}

export type ComponentData = EventComponent | MixsetComponent | LinkComponent;
export type ComponentType = ComponentData['type'];

// ----------------------------------------------
// Page
// ----------------------------------------------
export interface Page {
    id: string;
    userId: string;
    slug: string;
    components: ComponentData[];
}

// ----------------------------------------------
// Backlink
// ----------------------------------------------
export interface Backlink {
    id: string;
    componentTitle: string;
    componentType: 'show' | 'mixset';
    mentionerUsername: string;
    mentionerDisplayName: string;
    mentionerAvatarUrl: string;
}
