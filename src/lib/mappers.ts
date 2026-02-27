// lib/mappers.ts - DB ↔ Domain 변환 함수 통합
import type {
    Event as DBEvent,
    EventStack as DBEventStack,
    User as DBUser,
    Venue as DBVenue,
    Entry,
    EventVenue,
    EventData,
    VenueExternalSources,
} from '@/types/database';
import type { RAEventListingItem, RAVenueInfo } from '@/types/ra';
import {
    isPublicEventEntry,
    type ContentEntry,
    type Event,
    type EventEntry,
    type EventStack,
    type LinkEntry,
    type MixsetEntry,
    type PublicEventEntry,
    type User,
    type Venue,
} from '@/types/domain';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// User Mappers
// ============================================

export function mapUserToDomain(dbUser: DBUser): User {
    return {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.display_name || dbUser.username,
        avatarUrl: dbUser.avatar_url,
        bio: dbUser.bio,
        instagram: dbUser.instagram,
        soundcloud: dbUser.soundcloud,
    };
}

export function mapUserToDatabase(user: Partial<User>): Partial<DBUser> {
    return {
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        bio: user.bio,
        instagram: user.instagram,
        soundcloud: user.soundcloud,
    };
}

// ============================================
// Entry Mappers
// ============================================

export function mapEntryToDomain(dbEntry: Entry): ContentEntry {
    const base = {
        id: dbEntry.id,
        position: dbEntry.position,
        displayOrder: dbEntry.display_order,
        isVisible: dbEntry.is_visible,
        createdAt: dbEntry.created_at,
        updatedAt: dbEntry.updated_at,
    };

    switch (dbEntry.type) {
        case 'event': {
            const data = dbEntry.data as unknown as Record<string, unknown>;
            const refId = ('event_id' in data ? data.event_id : dbEntry.reference_id) as
                | string
                | null;

            const venue = data.venue as { venue_id?: string; name: string } | undefined;
            const lineup = data.lineup as { artist_id?: string; name: string }[] | undefined;

            const eventEntry: EventEntry = {
                ...base,
                type: 'event',
                title: (data.custom_title as string) || (data.title as string) || '',
                date: (data.date as string) || '',
                venue: venue ? { id: venue.venue_id, name: venue.name } : { name: '' },
                lineup: lineup?.map((p) => ({ id: p.artist_id, name: p.name })) || [],
                posterUrl: (data.poster_url as string) || '',
                description: data.description as string | undefined,
                links: data.links as { title: string; url: string }[] | undefined,
            };

            // 참조형 (reference_id 또는 data.event_id가 있는 경우)
            if (refId) {
                return { ...eventEntry, eventId: refId } as PublicEventEntry;
            }

            return eventEntry;
        }

        case 'mixset': {
            const data = dbEntry.data as unknown as Record<string, unknown>;

            // 참조형 (mixset_id가 있는 경우)
            if ('mixset_id' in data) {
                return {
                    ...base,
                    type: 'mixset',
                    mixsetId: data.mixset_id as string,
                    title: '',
                    tracklist: [],
                } as MixsetEntry;
            }

            // 자체형 (프라이빗 믹스셋)
            const tracklist = data.tracklist as
                | { track: string; artist: string; time: string }[]
                | undefined;
            return {
                ...base,
                type: 'mixset',
                title: (data.title as string) || '',
                tracklist: tracklist || [],
                coverUrl: data.cover_url as string | undefined,
                audioUrl: data.audio_url as string | undefined,
                soundcloudUrl: data.soundcloud_url as string | undefined,
                mixcloudUrl: data.mixcloud_url as string | undefined,
                description: data.description as string | undefined,
                durationMinutes: data.duration_minutes as number | undefined,
            } as MixsetEntry;
        }

        case 'link': {
            const data = dbEntry.data as unknown as Record<string, unknown>;
            return {
                ...base,
                type: 'link',
                title: (data.title as string) || '',
                url: (data.url as string) || '',
                icon: data.icon as string | undefined,
            } as LinkEntry;
        }

        default:
            throw new Error(`Unknown entry type: ${(dbEntry as Entry).type}`);
    }
}

/**
 * Zod .passthrough() 결과도 허용하는 넓은 입력 타입.
 * 내부 switch에서 구체 타입으로 좁혀 사용한다.
 */
type EntryMapperInput = ContentEntry | ({ type: ContentEntry['type'] } & Record<string, unknown>);

export function mapEntryToDatabase(
    entry: EntryMapperInput,
    position: number
): Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'page_id' | 'reference_id'> {
    switch (entry.type) {
        case 'event': {
            const eventEntry = entry as EventEntry;

            // 참조형
            if (isPublicEventEntry(eventEntry)) {
                return {
                    type: 'event',
                    position,
                    display_order: eventEntry.displayOrder,
                    is_visible: eventEntry.isVisible,
                    data: {
                        event_id: eventEntry.eventId,
                        custom_title: eventEntry.title || undefined,
                    },
                };
            }

            // 자체형
            return {
                type: 'event',
                position,
                display_order: eventEntry.displayOrder,
                is_visible: eventEntry.isVisible,
                data: {
                    title: eventEntry.title,
                    date: eventEntry.date,
                    venue: eventEntry.venue.id
                        ? { venue_id: eventEntry.venue.id, name: eventEntry.venue.name }
                        : { name: eventEntry.venue.name },
                    lineup: eventEntry.lineup.map((p) =>
                        p.id ? { artist_id: p.id, name: p.name } : { name: p.name }
                    ),
                    poster_url: eventEntry.posterUrl || undefined,
                    description: eventEntry.description || undefined,
                    links: eventEntry.links || undefined,
                },
            };
        }

        case 'mixset': {
            const mixsetEntry = entry as MixsetEntry;

            // 참조형
            if (mixsetEntry.mixsetId) {
                return {
                    type: 'mixset',
                    position,
                    display_order: mixsetEntry.displayOrder,
                    is_visible: mixsetEntry.isVisible,
                    data: {
                        mixset_id: mixsetEntry.mixsetId,
                    },
                };
            }

            // 자체형
            return {
                type: 'mixset',
                position,
                display_order: mixsetEntry.displayOrder,
                is_visible: mixsetEntry.isVisible,
                data: {
                    title: mixsetEntry.title,
                    tracklist: mixsetEntry.tracklist || [],
                    cover_url: mixsetEntry.coverUrl || undefined,
                    audio_url: mixsetEntry.audioUrl || undefined,
                    soundcloud_url: mixsetEntry.soundcloudUrl || undefined,
                    mixcloud_url: mixsetEntry.mixcloudUrl || undefined,
                    description: mixsetEntry.description || undefined,
                    duration_minutes: mixsetEntry.durationMinutes || undefined,
                },
            };
        }

        case 'link': {
            const linkEntry = entry as LinkEntry;
            return {
                type: 'link',
                position,
                display_order: linkEntry.displayOrder,
                is_visible: linkEntry.isVisible,
                data: {
                    title: linkEntry.title,
                    url: linkEntry.url,
                    icon: linkEntry.icon || undefined,
                },
            };
        }
    }
}

// ============================================
// Event Mappers
// ============================================

export function mapEventToDomain(dbEvent: DBEvent): Event {
    return {
        id: dbEvent.id,
        title: dbEvent.title,
        slug: dbEvent.slug,
        date: dbEvent.date,
        venue: dbEvent.venue.venue_id
            ? { id: dbEvent.venue.venue_id, name: dbEvent.venue.name }
            : { name: dbEvent.venue.name },
        lineup: dbEvent.lineup.map((p) =>
            p.artist_id ? { id: p.artist_id, name: p.name } : { name: p.name }
        ),
        posterUrl: dbEvent.data.poster_url,
        description: dbEvent.data.description,
        links: dbEvent.data.links,
        isPublic: dbEvent.is_public,
        createdBy: dbEvent.created_by,
    };
}

export function mapEventToEntry(dbEvent: DBEvent): EventEntry {
    return {
        id: uuidv4(),
        type: 'event',
        position: 0,
        displayOrder: null, // Page에 미표시
        isVisible: true,
        title: dbEvent.title || '',
        date: dbEvent.date,
        venue: dbEvent.venue.venue_id
            ? { id: dbEvent.venue.venue_id, name: dbEvent.venue.name }
            : { name: dbEvent.venue.name },
        lineup: dbEvent.lineup.map((p) =>
            p.artist_id ? { id: p.artist_id, name: p.name } : { name: p.name }
        ),
        posterUrl: dbEvent.data?.poster_url || '',
        description: dbEvent.data?.description,
        links: dbEvent.data?.links,
        createdAt: dbEvent.created_at,
        updatedAt: dbEvent.updated_at,
    };
}

export function mapEventToDatabase(
    event: Omit<Event, 'id'>,
    createdBy: string
): Omit<DBEvent, 'id' | 'created_at' | 'updated_at'> {
    return {
        title: event.title,
        slug: event.slug,
        date: event.date,
        venue: event.venue.id
            ? { venue_id: event.venue.id, name: event.venue.name }
            : { name: event.venue.name },
        lineup: event.lineup.map((p) =>
            p.id ? { artist_id: p.id, name: p.name } : { name: p.name }
        ),
        data: {
            poster_url: event.posterUrl,
            description: event.description,
            links: event.links,
        },
        is_public: event.isPublic,
        created_by: createdBy,
        source: event.source ?? 'manual',
    };
}

// ============================================
// Venue Mappers
// ============================================

export function mapVenueToDomain(dbVenue: DBVenue): Venue {
    return {
        id: dbVenue.id,
        name: dbVenue.name,
        slug: dbVenue.slug,
        city: dbVenue.city,
        country: dbVenue.country,
        address: dbVenue.address,
        googleMapsUrl: dbVenue.google_maps_url,
        instagram: dbVenue.instagram,
        website: dbVenue.website,
        claimedBy: dbVenue.claimed_by,
        source: dbVenue.source,
        externalSources: dbVenue.external_sources
            ? {
                  raUrl: dbVenue.external_sources.ra_url,
                  raVenueId: dbVenue.external_sources.ra_venue_id,
              }
            : undefined,
    };
}

export function mapVenueToString(venue: DBVenue): string {
    if (venue.city && venue.country) {
        return `${venue.name}, ${venue.city}, ${venue.country}`;
    }
    if (venue.city) {
        return `${venue.name}, ${venue.city}`;
    }
    return venue.name;
}

// ============================================
// Factory Functions
// ============================================

export function createEmptyEntry(type: 'event' | 'mixset' | 'link'): ContentEntry {
    const id = uuidv4();

    switch (type) {
        case 'event':
            return {
                id,
                type: 'event',
                position: 0,
                displayOrder: null, // Page에 미표시
                isVisible: true,
                title: '',
                date: new Date().toISOString().split('T')[0],
                venue: { name: '' },
                lineup: [],
                posterUrl: '',
                description: '',
                links: [],
                createdAt: '',
                updatedAt: '',
            } as EventEntry;

        case 'mixset':
            return {
                id,
                type: 'mixset',
                position: 0,
                displayOrder: null, // Page에 미표시
                isVisible: true,
                title: '',
                tracklist: [],
                coverUrl: '',
                audioUrl: '',
                soundcloudUrl: '',
                mixcloudUrl: '',
                description: '',
                createdAt: '',
                updatedAt: '',
            } as MixsetEntry;

        case 'link':
            return {
                id,
                type: 'link',
                position: 0,
                displayOrder: null, // Page에 미표시
                isVisible: true,
                title: '',
                url: '',
                icon: 'globe',
            } as LinkEntry;
    }
}

// ============================================
// Event Stack Mappers
// ============================================

export function mapEventStackToDomain(dbStack: DBEventStack): EventStack {
    return {
        id: dbStack.id,
        venueId: dbStack.venue_id,
        title: dbStack.title,
        eventCount: dbStack.event_count,
        firstEventDate: dbStack.first_event_date,
        lastEventDate: dbStack.last_event_date,
    };
}

// ============================================
// RA Import Mappers
// ============================================

/**
 * slug 생성 유틸리티
 */
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * 베뉴 slug 생성 (name 기반)
 * @example "Berghain" → "berghain-abc123"
 */
export function generateVenueSlug(name: string): string {
    return `${generateSlug(name)}-${Date.now().toString(36)}`;
}

/**
 * 이벤트 slug 생성 (title + date 기반)
 * mappers 내부 전용 — event.queries.ts의 generateEventSlug와 동일한 로직
 */
function generateImportEventSlug(title: string, date: string): string {
    const dateStr = date.split('T')[0];
    return `${generateSlug(title)}-${dateStr}-${Date.now().toString(36)}`;
}

// -- Input types (서버 전용 모듈 import 방지용 인라인 정의) --

export interface CreateImportedVenueInput {
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    source: string;
    external_sources: VenueExternalSources;
}

export interface CreateImportedEventInput {
    title: string;
    slug: string;
    date: string;
    venue: EventVenue;
    lineup: { artist_id?: string; name: string }[];
    data: EventData;
    is_public: boolean;
    created_by: string;
    source: string;
}

/**
 * RA 베뉴 정보 → DB 입력 데이터
 */
export function mapRAVenueToDbInput(raVenue: RAVenueInfo, raUrl: string): CreateImportedVenueInput {
    return {
        name: raVenue.name,
        slug: generateVenueSlug(raVenue.name),
        city: raVenue.area?.name ?? undefined,
        country: raVenue.area?.country?.name ?? undefined,
        address: raVenue.address ?? undefined,
        source: 'ra_import',
        external_sources: {
            ra_url: raUrl,
            ra_venue_id: raVenue.id,
        },
    };
}

/**
 * RA 이벤트 → DB 입력 데이터
 */
export function mapRAEventToDbInput(
    raEvent: RAEventListingItem,
    venueId: string,
    venueName: string,
    createdBy: string
): CreateImportedEventInput {
    const artistDetails = raEvent.artists.map((a) => ({
        name: a.name,
        ra_url: a.urlSafeName ? `https://ra.co/dj/${a.urlSafeName}` : null,
    }));
    const lineupText = raEvent.artists.map((a) => a.name).join(', ');

    const venue: EventVenue = { venue_id: venueId, name: venueName };
    const lineup = raEvent.artists.map((a) => ({ name: a.name }));

    const data: EventData = {
        description: lineupText ? `Lineup: ${lineupText}` : undefined,
    };

    // RA 메타데이터를 data에 추가
    const extendedData = {
        ...data,
        ra_event_url: raEvent.contentUrl ? `https://ra.co${raEvent.contentUrl}` : undefined,
        ra_event_id: raEvent.id,
        lineup_text: lineupText,
        artist_details: artistDetails,
    };

    return {
        title: raEvent.title || 'Untitled Event',
        slug: generateImportEventSlug(raEvent.title || 'event', raEvent.date),
        date: raEvent.date,
        venue,
        lineup,
        data: extendedData as EventData,
        is_public: true,
        created_by: createdBy,
        source: 'ra_import',
    };
}

// ============================================
// Utilities
// ============================================

export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        result[snakeKey] = obj[key];
    }
    return result;
}

// ============================================
// Legacy Aliases (호환성)
// ============================================

/** @deprecated Use mapEventToDomain */
export const dbEventToDomain = mapEventToDomain;
/** @deprecated Use mapEventToDomain */
export const dbEventToComponent = mapEventToDomain;
/** @deprecated Use mapEventToEntry */
export const dbEventToEntry = mapEventToEntry;
/** @deprecated Use mapEventToEntry */
export const eventToEntry = mapEventToEntry;
/** @deprecated Use mapEventToDatabase */
export const domainEventToDb = mapEventToDatabase;
/** @deprecated Use mapEventToDatabase */
export const componentToDbEvent = mapEventToDatabase;
/** @deprecated Use mapVenueToDomain */
export const dbVenueToDomain = mapVenueToDomain;
/** @deprecated Use mapVenueToString */
export const dbVenueToString = mapVenueToString;
/** @deprecated Use createEmptyEntry */
export const createEmptyComponent = createEmptyEntry;
/** @deprecated Use mapUserToDomain */
export const mapUserFromDb = mapUserToDomain;
