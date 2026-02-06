// lib/mappers.ts - DB ↔ Domain 변환 함수 통합
import type { Entry, Event as DBEvent, User as DBUser, Venue as DBVenue } from '@/types/database';
import type {
    ContentEntry,
    Event,
    EventEntry,
    LinkEntry,
    MixsetEntry,
    User,
    Venue,
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
        isVisible: dbEntry.is_visible,
    };

    switch (dbEntry.type) {
        case 'event': {
            const data = dbEntry.data as unknown as Record<string, unknown>;

            // 참조형 (event_id가 있는 경우)
            if ('event_id' in data) {
                return {
                    ...base,
                    type: 'event',
                    eventId: data.event_id as string,
                    title: (data.custom_title as string) || '',
                    date: '',
                    venue: { name: '' },
                    lineup: [],
                    posterUrl: '',
                } as EventEntry;
            }

            // 자체형 (프라이빗 이벤트)
            const venue = data.venue as { venue_id?: string; name: string } | undefined;
            const lineup = data.lineup as { artist_id?: string; name: string }[] | undefined;

            return {
                ...base,
                type: 'event',
                title: (data.title as string) || '',
                date: (data.date as string) || '',
                venue: venue ? { id: venue.venue_id, name: venue.name } : { name: '' },
                lineup: lineup?.map((p) => ({ id: p.artist_id, name: p.name })) || [],
                posterUrl: (data.poster_url as string) || '',
                description: data.description as string | undefined,
                links: data.links as { title: string; url: string }[] | undefined,
            } as EventEntry;
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

export function mapEntryToDatabase(
    entry: ContentEntry,
    position: number
): Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'page_id'> {
    switch (entry.type) {
        case 'event': {
            const eventEntry = entry as EventEntry;

            // 참조형
            if (eventEntry.eventId) {
                return {
                    type: 'event',
                    position,
                    is_visible: entry.isVisible,
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
                is_visible: entry.isVisible,
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
                    is_visible: entry.isVisible,
                    data: {
                        mixset_id: mixsetEntry.mixsetId,
                    },
                };
            }

            // 자체형
            return {
                type: 'mixset',
                position,
                is_visible: entry.isVisible,
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
                is_visible: entry.isVisible,
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
        isVisible: true,
        eventId: dbEvent.id,
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
                isVisible: true,
                title: '',
                date: new Date().toISOString().split('T')[0],
                venue: { name: '' },
                lineup: [],
                posterUrl: '',
                description: '',
                links: [],
            } as EventEntry;

        case 'mixset':
            return {
                id,
                type: 'mixset',
                position: 0,
                isVisible: true,
                title: '',
                tracklist: [],
                coverUrl: '',
                audioUrl: '',
                soundcloudUrl: '',
                mixcloudUrl: '',
                description: '',
            } as MixsetEntry;

        case 'link':
            return {
                id,
                type: 'link',
                position: 0,
                isVisible: true,
                title: '',
                url: '',
                icon: 'globe',
            } as LinkEntry;
    }
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
