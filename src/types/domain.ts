// types/domain.ts - UI/프론트엔드용 도메인 타입
// camelCase, 화면 표시에 최적화

// User & Page
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
}

export interface Page {
    id: string;
    userId: string;
    slug: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    themeColor?: string;
}

// ============================================
// Entry Types (Discriminated Union)
// ============================================

/** Event Entry - 참조형/자체형 통합 */
export interface EventEntry {
    id: string;
    type: 'event';
    position: number;
    isVisible: boolean;

    // 표시용 데이터
    title: string;
    date: string;
    venue: { id?: string; name: string };
    lineup: { id?: string; name: string }[];
    posterUrl: string;
    description?: string;
    links?: { title: string; url: string }[];

    // 참조 정보 (events 테이블 참조 시)
    eventId?: string;
}

/** Mixset Entry */
export interface MixsetEntry {
    id: string;
    type: 'mixset';
    position: number;
    isVisible: boolean;

    // 표시용 데이터
    title: string;
    coverUrl?: string;
    audioUrl?: string;
    soundcloudUrl?: string;
    mixcloudUrl?: string;
    tracklist: { track: string; artist: string; time: string }[];
    description?: string;
    durationMinutes?: number;

    // 참조 정보 (mixsets 테이블 참조 시)
    mixsetId?: string;
}

/** Link Entry */
export interface LinkEntry {
    id: string;
    type: 'link';
    position: number;
    isVisible: boolean;

    title: string;
    url: string;
    icon?: string;
}

/** Entry 유니온 */
export type ContentEntry = EventEntry | MixsetEntry | LinkEntry;
export type ContentEntryType = ContentEntry['type'];

export interface DisplayEntry {
    id: string;
    entryId: string;
    order: number;
    isVisible: boolean;
}

// ============================================
// Venue & Artist (UI용)
// ============================================
export interface Venue {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    googleMapsUrl?: string;
    instagram?: string;
    website?: string;
    claimedBy?: string;
}

export interface Artist {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    claimedBy?: string;
}

// ============================================
// Event & Mixset (상세 페이지용)
// ============================================
export interface Event {
    id: string;
    title: string;
    slug: string;
    date: string;
    venue: { id?: string; name: string };
    lineup: { id?: string; name: string }[];
    posterUrl?: string;
    description?: string;
    links?: { title: string; url: string }[];
    isPublic: boolean;
    createdBy: string;
}

export interface Mixset {
    id: string;
    title: string;
    slug: string;
    date?: string;
    durationMinutes?: number;
    tracklist: { track: string; artist: string; time: string }[];
    audioUrl?: string;
    coverUrl?: string;
    soundcloudUrl?: string;
    mixcloudUrl?: string;
    createdBy: string;
}

// ============================================
// Backlink (그래프뷰용)
// ============================================
export interface Backlink {
    id: string;
    entryTitle: string;
    entryType: 'event' | 'mixset';
    mentionerUsername: string;
    mentionerDisplayName: string;
    mentionerAvatarUrl?: string;
}

// Type Guards
export function isEventEntry(entry: ContentEntry): entry is EventEntry {
    return entry.type === 'event';
}

export function isMixsetEntry(entry: ContentEntry): entry is MixsetEntry {
    return entry.type === 'mixset';
}

export function isLinkEntry(entry: ContentEntry): entry is LinkEntry {
    return entry.type === 'link';
}

// ============================================
// Legacy Aliases (호환성)
// ============================================
/** @deprecated Use EventEntry */
export type EventComponent = EventEntry;
/** @deprecated Use MixsetEntry */
export type MixsetComponent = MixsetEntry;
/** @deprecated Use LinkEntry */
export type LinkComponent = LinkEntry;

/** @deprecated Use isEventEntry */
export const isEventComponent = isEventEntry;
/** @deprecated Use isMixsetEntry */
export const isMixsetComponent = isMixsetEntry;
/** @deprecated Use isLinkEntry */
export const isLinkComponent = isLinkEntry;
