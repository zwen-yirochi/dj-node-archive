// ==============================================
// types/mappers.ts - DB ↔ Domain 변환 함수
// ==============================================

import type {
    Event as DBEvent,
    EventWithVenue as DBEventWithVenue,
    VenueReference as DBVenueReference,
} from './database';
import type { EventComponent, MixsetComponent, LinkComponent } from './domain';

// ----------------------------------------------
// Event Mappers
// ----------------------------------------------

/**
 * DB Event → Domain EventComponent
 * @param dbEvent - DB에서 가져온 이벤트
 * @param venueName - 베뉴 이름 (조인 또는 별도 조회 필요)
 */
export function dbEventToComponent(dbEvent: DBEvent, venueName: string = ''): EventComponent {
    return {
        id: dbEvent.id,
        type: 'show',
        title: dbEvent.title ?? '',
        date: dbEvent.date,
        venue: venueName,
        posterUrl: dbEvent.data?.poster_url ?? '',
        lineup: dbEvent.data?.lineup_text?.split(',').map((s) => s.trim()) ?? [],
        description: dbEvent.data?.notes ?? '',
        eventId: dbEvent.id,
        venueId: dbEvent.venue_ref_id,
    };
}

/**
 * DB EventWithVenue → Domain EventComponent
 * @param dbEvent - 베뉴가 조인된 이벤트
 */
export function dbEventWithVenueToComponent(dbEvent: DBEventWithVenue): EventComponent {
    return dbEventToComponent(dbEvent, dbEvent.venue.name);
}

/**
 * Domain EventComponent → DB Event (생성/수정용)
 * @param component - 도메인 컴포넌트
 * @param userId - 사용자 ID
 * @param venueRefId - 베뉴 참조 ID
 */
export function componentToDbEvent(
    component: EventComponent,
    userId: string,
    venueRefId: string
): Omit<DBEvent, 'id' | 'created_at' | 'updated_at'> {
    return {
        user_id: userId,
        venue_ref_id: venueRefId,
        title: component.title,
        date: component.date,
        data: {
            poster_url: component.posterUrl,
            notes: component.description,
            lineup_text: component.lineup.join(', '),
        },
    };
}

// ----------------------------------------------
// Venue Mappers
// ----------------------------------------------

export function dbVenueToString(venue: DBVenueReference): string {
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
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
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
