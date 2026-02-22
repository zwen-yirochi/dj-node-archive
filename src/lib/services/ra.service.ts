// lib/services/ra.service.ts
// RA(Resident Advisor) GraphQL API 클라이언트
// venue(id) 쿼리 기반 — 베뉴 정보 + 과거 이벤트를 단일 쿼리로 조회

import type { RAEventListingItem, RAVenueInfo } from '@/types/ra';
import {
    type Result,
    success,
    failure,
    createNetworkError,
    createValidationError,
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

const PREVIEW_LIMIT = 50;
const MAX_EVENTS_DEFAULT = 500;
const UPCOMING_LIMIT = 100;

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
        date: e.date,
        contentUrl: e.contentUrl,
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
