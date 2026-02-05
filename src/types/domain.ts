// ==============================================
// types/domain.ts - 핵심 도메인 타입 (UI용)
// ==============================================

// ----------------------------------------------
// Utility Types
// ----------------------------------------------
/** ISO 8601 형식의 날짜 문자열 (e.g., "2024-01-15T09:00:00.000Z") */
export type ISODateString = string;

// ----------------------------------------------
// User
// ----------------------------------------------
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    instagram?: string;
    soundcloud?: string;
}

// ----------------------------------------------
// Entry Components (Discriminated Union)
// ----------------------------------------------
export interface EventComponent {
    id: string;
    type: 'event';
    title: string;
    date: ISODateString;
    venue: string;
    venueId?: string;
    posterUrl: string;
    lineup: string[];
    description: string;
    links?: { title: string; url: string }[];
    eventId?: string;
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
    mixsetId?: string;
}

export interface LinkComponent {
    id: string;
    type: 'link';
    title: string;
    url: string;
    icon: string;
}

export type ContentEntry = EventComponent | MixsetComponent | LinkComponent;
export type ContentEntryType = ContentEntry['type'];

// ----------------------------------------------
// Page
// ----------------------------------------------
export interface Page {
    id: string;
    userId: string;
    slug: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    entries: ContentEntry[];
}

// ----------------------------------------------
// Backlink
// ----------------------------------------------
export interface Backlink {
    id: string;
    componentTitle: string;
    componentType: 'event' | 'mixset';
    mentionerUsername: string;
    mentionerDisplayName: string;
    mentionerAvatarUrl: string;
}
