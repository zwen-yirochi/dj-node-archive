// types/ra.ts
// RA(Resident Advisor) API 관련 타입 정의

// ============================================
// RA GraphQL 응답 타입
// ============================================

/** RA GraphQL - 베뉴 정보 */
export interface RAVenueInfo {
    id: string;
    name: string;
    address: string | null;
    area: {
        name: string;
        country: {
            name: string;
        };
    } | null;
}

/** RA GraphQL - 아티스트 정보 */
export interface RAArtist {
    name: string;
    urlSafeName: string | null; // RA URL slug (e.g., "benklock")
}

/** RA GraphQL - 이벤트 리스팅 아이템 */
export interface RAEventListingItem {
    id: string;
    title: string;
    date: string; // ISO date string
    contentUrl: string | null; // e.g., "/events/1234567"
    artists: RAArtist[];
    venue: RAVenueInfo | null;
}

/** RA GraphQL - 아티스트 정보 (import용) */
export interface RAArtistInfo {
    id: string;
    name: string;
    urlSafeName: string | null;
}

// ============================================
// Import Preview / Confirm 응답 타입
// ============================================

/** Preview API에서 반환하는 이벤트 아이템 */
export interface PreviewEventItem {
    title: string;
    date: string;
    lineupText: string;
    artistDetails: { name: string; raUrl: string | null }[];
    raEventUrl: string | null;
}

/** Preview API 응답 (클라이언트용) */
export interface VenueImportPreview {
    venue: {
        name: string;
        city: string | null;
        country: string | null;
        address: string | null;
        raUrl: string;
    };
    events: {
        totalCount: number;
        items: PreviewEventItem[];
    };
}

/** Confirm API 응답 */
export interface VenueImportResult {
    venue: {
        id: string;
        name: string;
        slug: string;
    };
    importedEventsCount: number;
    importedUpcomingCount: number;
    stacksCreated: number;
}
