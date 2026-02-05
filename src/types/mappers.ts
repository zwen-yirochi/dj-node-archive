// ==============================================
// types/mappers.ts - DB ↔ Domain 변환 함수
// ==============================================

import type { DBEvent, DBVenue } from './database';
import type { EventComponent } from './domain';

// ----------------------------------------------
// Event Mappers
// ----------------------------------------------

/**
 * DB Event → Domain EventComponent
 * @param dbEvent - DB에서 가져온 이벤트
 */
export function dbEventToComponent(dbEvent: DBEvent): EventComponent {
    return {
        id: dbEvent.id,
        type: 'event',
        title: dbEvent.title ?? '',
        date: dbEvent.date,
        venue: dbEvent.venue?.name ?? '',
        venueId: dbEvent.venue?.venue_id,
        posterUrl: dbEvent.data?.poster_url ?? '',
        lineup: dbEvent.lineup?.map((item) => item.name) ?? [],
        description: dbEvent.data?.description ?? '',
        links: dbEvent.data?.links,
        eventId: dbEvent.id,
    };
}

/**
 * Domain EventComponent → DB Event (생성/수정용)
 * @param component - 도메인 컴포넌트
 * @param createdBy - 생성자 user ID
 */
export function componentToDbEvent(
    component: EventComponent,
    createdBy: string
): Omit<DBEvent, 'id' | 'slug' | 'is_public' | 'created_at' | 'updated_at'> {
    return {
        title: component.title,
        date: component.date,
        venue: {
            venue_id: component.venueId,
            name: component.venue,
        },
        lineup: component.lineup.map((name) => ({ name })),
        data: {
            poster_url: component.posterUrl,
            description: component.description,
            links: component.links,
        },
        created_by: createdBy,
    };
}

// ----------------------------------------------
// Venue Mappers
// ----------------------------------------------

export function dbVenueToString(venue: DBVenue): string {
    if (venue.city && venue.country) {
        return `${venue.name}, ${venue.city}, ${venue.country}`;
    }
    if (venue.city) {
        return `${venue.name}, ${venue.city}`;
    }
    return venue.name;
}

// ----------------------------------------------
// Type Converters (camelCase ↔ snake_case)
// ----------------------------------------------

/**
 * snake_case 객체를 camelCase로 변환
 */
export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

/**
 * camelCase 객체를 snake_case로 변환
 */
export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        result[snakeKey] = obj[key];
    }
    return result;
}
