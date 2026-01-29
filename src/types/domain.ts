// types/domain.ts
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
}

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

export interface Page {
    id: string;
    userId: string;
    slug: string;
    components: ComponentData[];
}
