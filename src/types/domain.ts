// types/domain.ts
// camelCase, 화면 표시에 최적화

// User & Page
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
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
export type VenueReference = { id?: string; name: string };
export type ArtistReference = { id?: string; name: string };
export type ExternalLink = { title: string; url: string };
export type TracklistItem = { track: string; artist: string; time: string };

/**
 * Entry 공통 필드
 * - position: Components 섹션 내 순서
 * - displayOrder: Page 섹션 내 순서 (null이면 Page에 미표시)
 * - isVisible: Page에 있을 때 일시적 숨김 여부
 */
interface EntryBase {
    id: string;
    position: number;
    displayOrder: number | null; // null = Page에 미표시
    isVisible: boolean; // displayOrder가 있을 때만 의미 있음
    createdAt: string;
    updatedAt: string;
}

/** Event Entry - 참조형/자체형 통합 */
export interface EventEntry extends EntryBase {
    type: 'event';
    title: string;
    date: string;
    venue: VenueReference;
    lineup: ArtistReference[];
    posterUrl: string;
    description?: string;
    links?: ExternalLink[];
}

export interface PublicEventEntry extends EventEntry {
    eventId: string;
}

/** Mixset Entry */
export interface MixsetEntry extends EntryBase {
    type: 'mixset';

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
export interface LinkEntry extends EntryBase {
    type: 'link';

    title: string;
    url: string;
    icon?: string;
}

/** Entry 유니온 */
export type ContentEntry = EventEntry | PublicEventEntry | MixsetEntry | LinkEntry;
export type ContentEntryType = ContentEntry['type'];

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
    source?: string;
    externalSources?: { raUrl?: string; raVenueId?: string };
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
    source?: string;
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

// ============================================
// Type Guards
// ============================================
export function isEventEntry(entry: ContentEntry): entry is EventEntry {
    return entry.type === 'event';
}

export function isPublicEventEntry(entry: EventEntry): entry is PublicEventEntry {
    return 'eventId' in entry && entry.eventId !== undefined;
}

export function isMixsetEntry(entry: ContentEntry): entry is MixsetEntry {
    return entry.type === 'mixset';
}

export function isLinkEntry(entry: ContentEntry): entry is LinkEntry {
    return entry.type === 'link';
}

// ============================================
// Helper Functions
// ============================================

export function isDisplayed(entry: ContentEntry): boolean {
    return typeof entry.displayOrder === 'number';
}

export function isVisibleOnPage(entry: ContentEntry): boolean {
    return typeof entry.displayOrder === 'number' && entry.isVisible;
}

// ============================================
// Form/API Data Types
// ============================================
export type CreateEventData = Pick<
    EventEntry,
    'title' | 'date' | 'venue' | 'lineup' | 'posterUrl' | 'description' | 'links'
>;

export type UpdateEventData = Partial<CreateEventData>;

// ============================================
// Legacy Aliases (호환성)
// ============================================
/** @deprecated Use LinkEntry */
export type LinkComponent = LinkEntry;

/** @deprecated Use isEventEntry */
export const isEventComponent = isEventEntry;
/** @deprecated Use isMixsetEntry */
export const isMixsetComponent = isMixsetEntry;
/** @deprecated Use isLinkEntry */
export const isLinkComponent = isLinkEntry;
