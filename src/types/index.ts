// Re-export result types
export * from './result';

// Re-export type guards
export * from './guards';

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
}

export interface Theme {
    accentColor: 'pink' | 'cyan' | 'purple';
    backgroundStyle: 'gradient' | 'solid' | 'image';
    backgroundImage?: string;
}

export interface EventComponent {
    id: string;
    type: 'show';
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    lineup: string[]; // @username format
    description: string;
    links?: { title: string; url: string }[];
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

export interface Backlink {
    id: string;
    componentTitle: string;
    componentType: 'show' | 'mixset';
    mentionerUsername: string;
    mentionerDisplayName: string;
    mentionerAvatarUrl: string;
}

// Editor types
export interface EditorState {
    user: User;
    components: ComponentData[];
    selectedComponentId: string | null;
    isDirty: boolean;
}

export interface ArtistSuggestion {
    username: string;
    displayName: string;
    avatarUrl: string;
}

export type FontOption = 'bebas' | 'instrument' | 'jetbrains';

export interface ThemePreset {
    id: string;
    name: string;
    accentColor: 'pink' | 'cyan' | 'purple';
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

export const ICON_OPTIONS = [
    'soundcloud',
    'spotify',
    'bandcamp',
    'instagram',
    'youtube',
    'twitter',
    'globe',
    'mail',
] as const;

export type IconOption = (typeof ICON_OPTIONS)[number];
