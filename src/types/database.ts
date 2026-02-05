// types/database.ts
export interface User {
    id: string;
    username: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface Page {
    id: string;
    user_id: string;
    slug: string;
    template_type?: string;
    theme?: Record<string, unknown>;
    is_public?: boolean;
    created_at: string;
    updated_at: string;
}

export type EntryType = 'event' | 'mixset' | 'link' | 'text' | 'image';

export interface LinkData {
    title: string;
    url: string;
    icon?: string;
}

export interface TextData {
    content: string;
}

export interface ImageData {
    url: string;
    alt?: string;
}

export interface EventData {
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    description: string;
    lineup: string[];
}

export interface MixsetData {
    title: string;
    releaseDate: string;
    genre: string;
    coverUrl: string;
    description: string;
}

export type EntryDataType = EventData | MixsetData | LinkData | TextData | ImageData;

export interface Entry {
    id: string;
    page_id: string;
    type: EntryType;
    position: number;
    data: EntryDataType;
    created_at: string;
    updated_at: string;
}

export interface PageWithEntries extends Page {
    entries: Entry[];
}

export interface UserWithPages extends User {
    pages: PageWithEntries[];
}

export type DBUser = User;
export type DBPage = Page;
export type DBEntry = Entry;
export type DBEntryType = EntryType;
export type DBPageWithEntries = PageWithEntries;
export type DBUserWithPages = UserWithPages;

// ============================================
// Venue Types
// ============================================
export interface VenueReference {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    instagram?: string;
    website?: string;
    google_maps_url?: string;
    linked_page_id?: string;
    linked_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface VenueSearchResult extends VenueReference {
    event_count: number;
}

export type DBVenueReference = VenueReference;
export type DBVenueSearchResult = VenueSearchResult;

// ============================================
// Artist Reference Types
// ============================================
export interface ArtistReference {
    id: string;
    name: string;
    instagram?: string;
    ra_url?: string;
    claimed_by?: string;
    created_by?: string;
    created_at: string;
}

export type DBArtistReference = ArtistReference;

// ============================================
// Event Types
// ============================================
export interface Event {
    id: string;
    user_id: string;
    venue_ref_id: string;
    title?: string;
    date: string;
    data?: {
        poster_url?: string;
        notes?: string;
        set_recording_url?: string;
        lineup_text?: string;
        imported_from?: string;
    };
    created_at: string;
    updated_at: string;
}

export interface EventWithVenue extends Event {
    venue: VenueReference;
}

export type DBEvent = Event;
export type DBEventWithVenue = EventWithVenue;

// ============================================
// Event Performer Types
// ============================================
export type PerformanceType = 'dj_set' | 'live' | 'b2b';

export interface EventPerformer {
    id: string;
    event_id: string;
    user_id?: string;
    artist_ref_id?: string;
    performance_type: PerformanceType;
    created_at: string;
}

export type DBEventPerformer = EventPerformer;
