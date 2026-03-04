// types/domain.ts
// camelCase, 화면 표시에 최적화

// Header Style
export type HeaderStyle = 'minimal' | 'banner' | 'portrait' | 'shapes';

// Profile Links
export type ProfileLinkType =
    | 'instagram'
    | 'bandcamp'
    | 'spotify'
    | 'apple_music'
    | 'soundcloud'
    | 'custom';

export interface ProfileLink {
    type: ProfileLinkType;
    url: string;
    label?: string;
    enabled?: boolean;
}

// Page Settings
export interface PageSettings {
    headerStyle: HeaderStyle;
    links: ProfileLink[];
}

// User & Page
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
}

export interface Page {
    id: string;
    userId: string;
    slug: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    themeColor?: string;
    headerStyle?: HeaderStyle;
    links: ProfileLink[];
}

// ============================================
// Entry Types (Discriminated Union)
// ============================================
export type VenueReference = { id?: string; name: string };
export type ArtistReference = { id?: string; name: string };
export type ExternalLink = { title: string; url: string };
export type TracklistItem = { track: string; artist: string; time: string };

// ============================================
// Custom Block Types
// ============================================
export type SectionBlockType = 'header' | 'richtext' | 'image' | 'embed' | 'keyvalue' | 'list';

export interface HeaderBlockData {
    title: string;
    subtitle?: string;
}
export interface RichTextBlockData {
    content: string;
}
export interface ImageBlockData {
    url: string;
    alt?: string;
    caption?: string;
}
export interface EmbedBlockData {
    url: string;
    provider?: string;
}
export interface KeyValueBlockData {
    items: { key: string; value: string }[];
}
export interface ListBlockData {
    items: string[];
    style?: 'bullet' | 'numbered' | 'plain';
}

export interface SectionBlockDataMap {
    header: HeaderBlockData;
    richtext: RichTextBlockData;
    image: ImageBlockData;
    embed: EmbedBlockData;
    keyvalue: KeyValueBlockData;
    list: ListBlockData;
}

export interface SectionBlock<T extends SectionBlockType = SectionBlockType> {
    id: string;
    type: T;
    data: SectionBlockDataMap[T];
}

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
    url?: string;
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
    description?: string;
}

/** Custom Block Entry */
export interface CustomEntry extends EntryBase {
    type: 'custom';
    title: string;
    blocks: SectionBlock[];
}

/** Entry 유니온 */
export type ContentEntry = EventEntry | PublicEventEntry | MixsetEntry | LinkEntry | CustomEntry;
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
// Event Stack
// ============================================
export interface EventStack {
    id: string;
    venueId: string;
    title: string;
    eventCount: number;
    firstEventDate: string | null;
    lastEventDate: string | null;
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

export function isCustomEntry(entry: ContentEntry): entry is CustomEntry {
    return entry.type === 'custom';
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
