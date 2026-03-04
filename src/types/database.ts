// types/database.ts
// DB 테이블과 1:1 대응 (snake_case)

type ISODateString = string;

// ============================================
// User & Page
// ============================================
export interface User {
    id: string;
    auth_user_id: string;
    username: string;
    email?: string;
    display_name?: string;
    avatar_url: string;
    bio?: string;
    created_at: ISODateString;
    updated_at: ISODateString;
}

export interface ProfileLinkData {
    type: string;
    url: string;
    label?: string;
    enabled?: boolean;
}

export interface Page {
    id: string;
    user_id: string;
    slug: string;
    title?: string;
    bio?: string;
    avatar_url?: string;
    theme_color?: string;
    header_style?: string;
    links?: ProfileLinkData[];
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Entry Data Types (entries.data JSONB)
// ============================================

/** type='link' */
export interface LinkEntryData {
    title: string;
    url: string;
    icon?: string;
}

/** type='event' 참조형 - events 테이블 참조 */
export interface EventReferenceData {
    event_id: string;
    custom_title?: string;
}

/** type='event' 자체형 - 프라이빗 이벤트 */
export interface EventSelfData {
    title: string;
    date: string;
    venue: { venue_id?: string; name: string };
    lineup?: { artist_id?: string; name: string }[];
    poster_url?: string;
    description?: string;
    links?: { title: string; url: string }[];
}

/** type='mixset' 참조형 - mixsets 테이블 참조 */
export interface MixsetReferenceData {
    mixset_id: string;
}

/** type='mixset' 자체형 - 프라이빗 믹스셋 */
export interface MixsetSelfData {
    title: string;
    tracklist?: Track[];
    cover_url?: string;
    url?: string;
    description?: string;
    duration_minutes?: number;
}

export type MixsetEntryData = MixsetReferenceData | MixsetSelfData;

/** type='custom' - 커스텀 블록 엔트리 */
export interface CustomEntryData {
    title: string;
    blocks: {
        id: string;
        type: string;
        data: Record<string, unknown>;
    }[];
}

export type EntryType = 'link' | 'event' | 'mixset' | 'custom';
export type EntryData =
    | LinkEntryData
    | EventReferenceData
    | EventSelfData
    | MixsetEntryData
    | CustomEntryData;

// ============================================
// Entry
// ============================================
export interface Entry {
    id: string;
    page_id: string;
    type: EntryType;
    position: number;
    display_order: number | null; // null = Page에 미표시
    is_visible: boolean; // display_order가 있을 때 일시적 숨김 여부
    reference_id: string | null; // events/mixsets 테이블 참조 ID
    data: EntryData;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Venue
// ============================================
export interface VenueExternalSources {
    ra_url?: string;
    ra_venue_id?: string;
}

export interface Venue {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    google_maps_url?: string;
    instagram?: string;
    website?: string;
    claimed_by?: string;
    source: string;
    external_sources: VenueExternalSources;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Artist
// ============================================
export interface Artist {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    claimed_by?: string;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Event JSONB Types
// ============================================
export interface EventVenue {
    venue_id?: string;
    name: string;
}

export interface EventPerformer {
    artist_id?: string;
    name: string;
}

export interface EventLink {
    title: string;
    url: string;
}

export interface EventData {
    poster_url?: string;
    description?: string;
    links?: EventLink[];
}

// ============================================
// Event Stack
// ============================================
export interface EventStack {
    id: string;
    venue_id: string;
    title: string;
    event_count: number;
    first_event_date: string | null;
    last_event_date: string | null;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Event
// ============================================
export interface Event {
    id: string;
    title: string;
    slug: string;
    date: string;
    venue: EventVenue;
    lineup: EventPerformer[];
    data: EventData;
    is_public: boolean;
    created_by: string;
    source: string;
    stack_id?: string | null;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Mixset
// ============================================
export interface Track {
    track: string;
    artist: string;
    time: string;
}

export interface Mixset {
    id: string;
    title: string;
    slug: string;
    date?: string;
    duration_minutes?: number;
    tracklist: Track[];
    audio_url?: string;
    cover_url?: string;
    soundcloud_url?: string;
    mixcloud_url?: string;
    created_by: string;
    created_at: ISODateString;
    updated_at: ISODateString;
}

// ============================================
// Mention (백링크)
// ============================================
export type MentionSourceType = 'event' | 'entry' | 'page';
export type MentionTargetType = 'venue' | 'artist' | 'event' | 'user';
export type MentionContext = 'venue' | 'lineup' | 'description_mention' | 'event_reference';

export interface Mention {
    id: string;
    source_type: MentionSourceType;
    source_id: string;
    target_type: MentionTargetType;
    target_id: string;
    context: MentionContext;
    created_at: ISODateString;
}

// ============================================
// Composed Types
// ============================================
export interface PageWithEntries extends Page {
    entries: Entry[];
}

export interface UserWithPage extends User {
    page: Page;
}

export interface UserWithPages extends User {
    pages: PageWithEntries[];
}

export interface EventWithRelations extends Event {
    venue_detail?: Venue;
    performers?: Artist[];
}

// ============================================
// Type Guards
// ============================================
export function isEventReference(data: EntryData): data is EventReferenceData {
    return 'event_id' in data;
}

export function isEventSelf(data: EntryData): data is EventSelfData {
    return 'title' in data && 'date' in data && 'venue' in data && !('event_id' in data);
}

export function isLinkEntry(data: EntryData): data is LinkEntryData {
    return 'url' in data && !('event_id' in data) && !('mixset_id' in data);
}

export function isMixsetReference(data: EntryData): data is MixsetReferenceData {
    return 'mixset_id' in data;
}

export function isMixsetSelf(data: EntryData): data is MixsetSelfData {
    return (
        'title' in data &&
        'tracklist' in data &&
        !('event_id' in data) &&
        !('mixset_id' in data) &&
        !('url' in data)
    );
}

export function isMixsetEntry(data: EntryData): data is MixsetEntryData {
    return isMixsetReference(data) || isMixsetSelf(data);
}

// ============================================
// Legacy Aliases (호환성)
// ============================================
export type DBUser = User;
export type DBPage = Page;
export type DBEntry = Entry;
export type DBEntryType = EntryType;
export type DBPageWithEntries = PageWithEntries;
export type DBUserWithPages = UserWithPages;

export type VenueReference = Venue;
export type DBVenueReference = Venue;
export type DBVenueSearchResult = Venue & { event_count: number };

export type ArtistReference = Artist;
export type DBArtistReference = Artist;

export type DBEvent = Event;
export type DBEventWithVenue = EventWithRelations;

export type PerformanceType = 'dj_set' | 'live' | 'b2b';
export type DBEventPerformer = EventPerformer;
