// lib/services/ra.service.ts
// RA(Resident Advisor) GraphQL API 클라이언트
// venue(id) 쿼리 기반 — 베뉴 정보 + 과거 이벤트를 단일 쿼리로 조회

import type { RAArtistInfo, RAEventListingItem, RAVenueInfo } from '@/types/ra';
import {
    createNetworkError,
    createValidationError,
    failure,
    success,
    type Result,
} from '@/types/result';

const RA_GRAPHQL_ENDPOINT = 'https://ra.co/graphql';

const RA_HEADERS = {
    'Content-Type': 'application/json',
    Referer: 'https://ra.co',
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// venue(id) 쿼리 — 베뉴 정보 + 과거 이벤트
const VENUE_WITH_EVENTS_QUERY = `
  query GET_VENUE($id: ID!, $eventLimit: Int!) {
    venue(id: $id) {
      id
      name
      address
      area {
        name
        country {
          name
        }
      }
      events(type: PREVIOUS, limit: $eventLimit) {
        id
        title
        date
        contentUrl
        artists {
          id
          name
          urlSafeName
        }
      }
    }
  }
`;

// venue(id) 쿼리 — 베뉴 정보 + 예정 이벤트
const VENUE_UPCOMING_EVENTS_QUERY = `
  query GET_VENUE_UPCOMING($id: ID!, $eventLimit: Int!) {
    venue(id: $id) {
      id
      name
      address
      area {
        name
        country {
          name
        }
      }
      events(type: LATEST, limit: $eventLimit) {
        id
        title
        date
        contentUrl
        artists {
          id
          name
          urlSafeName
        }
      }
    }
  }
`;

// 베뉴 정보만 조회 (이벤트 없이)
const VENUE_INFO_QUERY = `
  query GET_VENUE_INFO($id: ID!) {
    venue(id: $id) {
      id
      name
      address
      area {
        name
        country {
          name
        }
      }
    }
  }
`;

// artist(slug) 쿼리 — 아티스트 정보 + 과거 이벤트
const ARTIST_WITH_EVENTS_QUERY = `
  query GET_ARTIST($slug: String!, $eventLimit: Int!) {
    artist(slug: $slug) {
      id
      name
      urlSafeName
      events(type: PREVIOUS, limit: $eventLimit) {
        id
        title
        date
        content
        contentUrl
        images {
          filename
        }
        venue {
          id
          name
          address
          area {
            name
            country {
              name
            }
          }
        }
        artists {
          id
          name
          urlSafeName
        }
      }
    }
  }
`;

// event(id) 쿼리 — 단일 이벤트 상세
const SINGLE_EVENT_QUERY = `
  query GET_EVENT($id: ID!) {
    event(id: $id) {
      id
      title
      date
      content
      contentUrl
      images {
        filename
      }
      venue {
        id
        name
        address
        area {
          name
          country {
            name
          }
        }
      }
      artists {
        id
        name
        urlSafeName
      }
    }
  }
`;

interface RAVenueResponse {
    data: {
        venue: {
            id: string;
            name: string;
            address: string | null;
            area: {
                name: string;
                country: { name: string };
            } | null;
            events?: Array<{
                id: string;
                title: string;
                date: string;
                contentUrl: string | null;
                artists: Array<{
                    id: string;
                    name: string;
                    urlSafeName: string | null;
                }>;
            }>;
        } | null;
    };
}

interface RAArtistResponse {
    data: {
        artist: {
            id: string;
            name: string;
            urlSafeName: string | null;
            events?: Array<{
                id: string;
                title: string;
                date: string;
                content: string | null;
                contentUrl: string | null;
                images?: Array<{ filename: string }>;
                venue: {
                    id: string;
                    name: string;
                    address: string | null;
                    area: {
                        name: string;
                        country: { name: string };
                    } | null;
                } | null;
                artists: Array<{
                    id: string;
                    name: string;
                    urlSafeName: string | null;
                }>;
            }>;
        } | null;
    };
}

interface RASingleEventResponse {
    data: {
        event: {
            id: string;
            title: string;
            date: string;
            content: string | null;
            contentUrl: string | null;
            images?: Array<{ filename: string }>;
            venue: {
                id: string;
                name: string;
                address: string | null;
                area: {
                    name: string;
                    country: { name: string };
                } | null;
            } | null;
            artists: Array<{
                id: string;
                name: string;
                urlSafeName: string | null;
            }>;
        } | null;
    };
}

const PREVIEW_LIMIT = 50;
const MAX_EVENTS_DEFAULT = 500;
const UPCOMING_LIMIT = 100;
const ARTIST_MAX_EVENTS = 500;

/**
 * RA 날짜 형식 → YYYY-MM-DD 변환
 * @example "2026-03-14T00:00:00.000" → "2026-03-14"
 */
function normalizeRADate(date: string): string {
    return date.split('T')[0];
}

/**
 * RA 베뉴 URL에서 venue ID 추출
 * @example "https://ra.co/clubs/5031" → "5031"
 */
export function parseRAVenueUrl(url: string): Result<{ venueId: string }> {
    const match = url.match(/ra\.co\/clubs\/(\d+)/);
    if (!match) {
        return failure(
            createValidationError(
                'Invalid RA venue URL. Expected format: https://ra.co/clubs/{id}',
                'ra_url'
            )
        );
    }
    return success({ venueId: match[1] });
}

/**
 * RA 아티스트 URL에서 slug 추출
 * @example "https://ra.co/dj/benklock" → "benklock"
 */
export function parseRAArtistUrl(url: string): Result<{ artistSlug: string }> {
    const match = url.match(/ra\.co\/dj\/([\w-]+)/);
    if (!match) {
        return failure(
            createValidationError(
                'Invalid RA artist URL. Expected format: https://ra.co/dj/{name}',
                'ra_url'
            )
        );
    }
    return success({ artistSlug: match[1] });
}

/**
 * RA 이벤트 URL에서 event ID 추출
 * @example "https://ra.co/events/1234567" → "1234567"
 */
export function parseRAEventUrl(url: string): Result<{ eventId: string }> {
    const match = url.match(/ra\.co\/events\/(\d+)/);
    if (!match) {
        return failure(
            createValidationError(
                'Invalid RA event URL. Expected format: https://ra.co/events/{id}',
                'ra_url'
            )
        );
    }
    return success({ eventId: match[1] });
}

/**
 * RA GraphQL API 호출 헬퍼
 */
async function queryRA<T>(query: string, variables: Record<string, unknown>): Promise<Result<T>> {
    try {
        const response = await fetch(RA_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: RA_HEADERS,
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            return failure(
                createNetworkError(
                    `RA API responded with status ${response.status}`,
                    response.status
                )
            );
        }

        const json = await response.json();

        if (json.errors?.length > 0) {
            return failure(createNetworkError(`RA API error: ${json.errors[0].message}`));
        }

        return success(json as T);
    } catch (err) {
        return failure(
            createNetworkError(
                'RA 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
                undefined,
                err
            )
        );
    }
}

/**
 * RA 응답에서 venue 정보를 RAVenueInfo로 변환
 */
function extractVenueInfo(venue: NonNullable<RAVenueResponse['data']['venue']>): RAVenueInfo {
    return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        area: venue.area,
    };
}

/**
 * RA 응답에서 events를 RAEventListingItem[]으로 변환
 */
function extractEvents(
    events: NonNullable<RAVenueResponse['data']['venue']>['events'],
    venue: RAVenueInfo
): RAEventListingItem[] {
    if (!events) return [];
    return events.map((e) => ({
        id: e.id,
        title: e.title,
        date: normalizeRADate(e.date),
        description: null,
        contentUrl: e.contentUrl,
        imageUrls: [],
        artists: e.artists.map((a) => ({
            name: a.name,
            urlSafeName: a.urlSafeName,
        })),
        venue,
    }));
}

/**
 * RA 베뉴 정보 + 이벤트 미리보기 (Preview용, 50건)
 */
export async function fetchRAVenueEvents(
    venueId: string
): Promise<
    Result<{ venue: RAVenueInfo | null; events: RAEventListingItem[]; totalResults: number }>
> {
    const result = await queryRA<RAVenueResponse>(VENUE_WITH_EVENTS_QUERY, {
        id: venueId,
        eventLimit: PREVIEW_LIMIT,
    });

    if (!result.success) return result;

    const venue = result.data.data.venue;
    if (!venue) {
        return success({ venue: null, events: [], totalResults: 0 });
    }

    const venueInfo = extractVenueInfo(venue);
    const events = extractEvents(venue.events, venueInfo);

    return success({
        venue: venueInfo,
        events,
        totalResults: events.length,
    });
}

/**
 * RA 베뉴의 전체 이벤트 수집 (Confirm용)
 * 과거 (최대 500건) + 예정 (최대 100건) 병렬 조회
 */
export async function fetchAllRAVenueEvents(
    venueId: string,
    maxPastEvents: number = MAX_EVENTS_DEFAULT
): Promise<
    Result<{
        venue: RAVenueInfo | null;
        pastEvents: RAEventListingItem[];
        upcomingEvents: RAEventListingItem[];
        totalResults: number;
    }>
> {
    const limit = Math.min(maxPastEvents, MAX_EVENTS_DEFAULT);

    // 과거 + 예정 병렬 조회
    const [pastResult, upcomingResult] = await Promise.all([
        queryRA<RAVenueResponse>(VENUE_WITH_EVENTS_QUERY, {
            id: venueId,
            eventLimit: limit,
        }),
        queryRA<RAVenueResponse>(VENUE_UPCOMING_EVENTS_QUERY, {
            id: venueId,
            eventLimit: UPCOMING_LIMIT,
        }),
    ]);

    if (!pastResult.success) return pastResult;

    const venue = pastResult.data.data.venue;
    if (!venue) {
        return success({ venue: null, pastEvents: [], upcomingEvents: [], totalResults: 0 });
    }

    const venueInfo = extractVenueInfo(venue);
    const pastEvents = extractEvents(venue.events, venueInfo);

    let upcomingEvents: RAEventListingItem[] = [];
    if (upcomingResult.success && upcomingResult.data.data.venue?.events) {
        upcomingEvents = extractEvents(upcomingResult.data.data.venue.events, venueInfo);
    }

    return success({
        venue: venueInfo,
        pastEvents,
        upcomingEvents,
        totalResults: pastEvents.length + upcomingEvents.length,
    });
}

/**
 * RA 아티스트 이벤트를 RAEventListingItem[]으로 변환
 */
function extractArtistEvents(
    events: NonNullable<NonNullable<RAArtistResponse['data']['artist']>['events']>
): RAEventListingItem[] {
    if (!events) return [];
    return events.map((e) => {
        const venue: RAVenueInfo | null = e.venue
            ? {
                  id: e.venue.id,
                  name: e.venue.name,
                  address: e.venue.address,
                  area: e.venue.area,
              }
            : null;
        return {
            id: e.id,
            title: e.title,
            date: normalizeRADate(e.date),
            description: e.content || null,
            contentUrl: e.contentUrl,
            imageUrls: e.images?.map((img) => img.filename).filter(Boolean) ?? [],
            artists: e.artists.map((a) => ({
                name: a.name,
                urlSafeName: a.urlSafeName,
            })),
            venue,
        };
    });
}

/**
 * RA 베뉴 예정 이벤트만 조회 (Cron refresh용)
 */
export async function fetchRAVenueUpcomingEvents(
    venueId: string,
    maxEvents: number = UPCOMING_LIMIT
): Promise<Result<{ venue: RAVenueInfo | null; events: RAEventListingItem[] }>> {
    const result = await queryRA<RAVenueResponse>(VENUE_UPCOMING_EVENTS_QUERY, {
        id: venueId,
        eventLimit: Math.min(maxEvents, UPCOMING_LIMIT),
    });

    if (!result.success) return result;

    const venue = result.data.data.venue;
    if (!venue) {
        return success({ venue: null, events: [] });
    }

    const venueInfo = extractVenueInfo(venue);
    const events = extractEvents(venue.events, venueInfo);

    return success({ venue: venueInfo, events });
}

/**
 * RA 아티스트 이벤트 미리보기 (Preview용)
 */
export async function fetchRAArtistEvents(
    artistSlug: string
): Promise<
    Result<{ artist: RAArtistInfo | null; events: RAEventListingItem[]; totalResults: number }>
> {
    const result = await queryRA<RAArtistResponse>(ARTIST_WITH_EVENTS_QUERY, {
        slug: artistSlug,
        eventLimit: PREVIEW_LIMIT,
    });

    if (!result.success) return result;

    const artist = result.data.data.artist;
    if (!artist) {
        return success({ artist: null, events: [], totalResults: 0 });
    }

    const artistInfo: RAArtistInfo = {
        id: artist.id,
        name: artist.name,
        urlSafeName: artist.urlSafeName,
    };

    const events = extractArtistEvents(artist.events ?? []);

    return success({
        artist: artistInfo,
        events,
        totalResults: events.length,
    });
}

/**
 * RA 아티스트 전체 이벤트 수집 (Confirm용)
 */
export async function fetchAllRAArtistEvents(
    artistSlug: string
): Promise<Result<{ artist: RAArtistInfo | null; events: RAEventListingItem[] }>> {
    const result = await queryRA<RAArtistResponse>(ARTIST_WITH_EVENTS_QUERY, {
        slug: artistSlug,
        eventLimit: ARTIST_MAX_EVENTS,
    });

    if (!result.success) return result;

    const artist = result.data.data.artist;
    if (!artist) {
        return success({ artist: null, events: [] });
    }

    const artistInfo: RAArtistInfo = {
        id: artist.id,
        name: artist.name,
        urlSafeName: artist.urlSafeName,
    };

    const events = extractArtistEvents(artist.events ?? []);

    return success({ artist: artistInfo, events });
}

/**
 * RA 단일 이벤트 조회
 */
export async function fetchRAEvent(eventId: string): Promise<Result<RAEventListingItem | null>> {
    const result = await queryRA<RASingleEventResponse>(SINGLE_EVENT_QUERY, {
        id: eventId,
    });

    if (!result.success) return result;

    const event = result.data.data.event;
    if (!event) return success(null);

    const venue: RAVenueInfo | null = event.venue
        ? {
              id: event.venue.id,
              name: event.venue.name,
              address: event.venue.address,
              area: event.venue.area,
          }
        : null;

    return success({
        id: event.id,
        title: event.title,
        date: normalizeRADate(event.date),
        description: event.content || null,
        contentUrl: event.contentUrl,
        imageUrls: event.images?.map((img) => img.filename).filter(Boolean) ?? [],
        artists: event.artists.map((a) => ({
            name: a.name,
            urlSafeName: a.urlSafeName,
        })),
        venue,
    });
}
