// ==============================================
// types/database.ts - DB 스키마 타입 정의
// ==============================================

// ----------------------------------------------
// Users
// ----------------------------------------------
export interface DBUser {
    id: string;
    auth_user_id?: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Pages
// ----------------------------------------------
export interface DBPage {
    id: string;
    user_id: string;
    slug: string;
    title?: string;
    bio?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Venues
// ----------------------------------------------
export interface DBVenue {
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
    created_at: string;
    updated_at: string;
}

export interface DBVenueSearchResult {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    instagram?: string;
    website?: string;
    event_count?: number;
}

// ----------------------------------------------
// Artists
// ----------------------------------------------
export interface DBArtist {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    claimed_by?: string;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Events
// ----------------------------------------------
export interface DBEventVenue {
    venue_id?: string;
    name: string;
}

export interface DBEventLineupItem {
    artist_id?: string;
    name: string;
}

export interface DBEventData {
    poster_url?: string;
    description?: string;
    links?: { title: string; url: string }[];
}

export interface DBEvent {
    id: string;
    title: string;
    slug: string;
    date: string;
    venue: DBEventVenue;
    lineup: DBEventLineupItem[];
    data: DBEventData;
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Mixsets
// ----------------------------------------------
export interface DBMixsetTrack {
    track: string;
    artist: string;
    time: string;
}

export interface DBMixset {
    id: string;
    title: string;
    slug: string;
    date?: string;
    duration_minutes?: number;
    tracklist: DBMixsetTrack[];
    audio_url?: string;
    cover_url?: string;
    soundcloud_url?: string;
    mixcloud_url?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Entries
// ----------------------------------------------
export type DBEntryType = 'link' | 'event' | 'mixset';

export interface DBLinkData {
    url: string;
    title: string;
    icon?: string;
}

export interface DBEventRefData {
    event_id: string;
    custom_title?: string;
}

export interface DBInlineEventData {
    title: string;
    date: string;
    venue: DBEventVenue;
    lineup?: DBEventLineupItem[];
    poster_url?: string;
    description?: string;
    links?: { title: string; url: string }[];
}

export interface DBMixsetRefData {
    mixset_id: string;
}

export type DBEntryData = DBLinkData | DBEventRefData | DBInlineEventData | DBMixsetRefData;

export interface DBEntry {
    id: string;
    page_id: string;
    type: DBEntryType;
    position: number;
    is_visible: boolean;
    data: DBEntryData;
    created_at: string;
    updated_at: string;
}

// ----------------------------------------------
// Mentions
// ----------------------------------------------
export type DBMentionSourceType = 'event' | 'entry' | 'page';
export type DBMentionTargetType = 'venue' | 'artist' | 'event' | 'user';
export type DBMentionContext = 'venue' | 'lineup' | 'description_mention' | 'event_reference';

export interface DBMention {
    id: string;
    source_type: DBMentionSourceType;
    source_id: string;
    target_type: DBMentionTargetType;
    target_id: string;
    context: DBMentionContext;
    created_at: string;
}

// ----------------------------------------------
// Joined Types
// ----------------------------------------------
export interface DBPageWithEntries extends DBPage {
    entries: DBEntry[];
}

export interface DBUserWithPages extends DBUser {
    pages: DBPageWithEntries[];
}

// ----------------------------------------------
// Legacy Aliases (migration compatibility)
// ----------------------------------------------
/** @deprecated Use DBUser instead */
export type User = DBUser;
/** @deprecated Use DBPage instead */
export type Page = DBPage;
/** @deprecated Use DBEntry instead */
export type Entry = DBEntry;
/** @deprecated Use DBEntryType instead */
export type EntryType = DBEntryType;
/** @deprecated Use DBPageWithEntries instead */
export type PageWithEntries = DBPageWithEntries;
/** @deprecated Use DBUserWithPages instead */
export type UserWithPages = DBUserWithPages;
/** @deprecated Use DBVenue instead */
export type DBVenueReference = DBVenue;
/** @deprecated Use DBArtist instead */
export type DBArtistReference = DBArtist;
/** @deprecated Use DBEvent instead */
export type DBEventWithVenue = DBEvent;
