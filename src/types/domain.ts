// ==============================================
// types/domain.ts - 핵심 도메인 타입 (단일 소스)
// ==============================================

// Utility Types
/** ISO 8601 형식의 날짜 문자열 (e.g., "2024-01-15T09:00:00.000Z") */
export type ISODateString = string;

// User
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
}

// Entries (Discriminated Union)
export interface EventEntry {
    id: string;
    type: 'event';
    title: string;
    date: ISODateString;
    venue: string;
    posterUrl: string;
    lineup: string[];
    description: string;
    links?: { title: string; url: string }[];
    // 원본 이벤트 연결 (이벤트 import 시)
    eventId?: string;
    venueId?: string;
}

export interface MixsetEntry {
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

export interface LinkEntry {
    id: string;
    type: 'link';
    title: string;
    url: string;
    icon: string;
}

export type ContentEntry = EventEntry | MixsetEntry | LinkEntry;
export type ContentEntryType = ContentEntry['type'];

// Page
export interface Page {
    id: string;
    userId: string;
    slug: string;
    entries: ContentEntry[];
}

// Backlink
export interface Backlink {
    id: string;
    componentTitle: string;
    componentType: 'event' | 'mixset';
    mentionerUsername: string;
    mentionerDisplayName: string;
    mentionerAvatarUrl: string;
}
