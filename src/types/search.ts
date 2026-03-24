// types/search.ts - 통합 검색 타입 정의

// ============================================
// Search Result Items
// ============================================

export interface SearchArtistItem {
    id: string;
    username: string;
    display_name?: string;
    avatar_url: string;
    url: string; // /{username}
}

export interface SearchVenueItem {
    id: string;
    name: string;
    slug: string;
    city?: string;
    event_count: number;
    url: string; // /venues/{slug}
}

export interface SearchEventItem {
    id: string;
    title: string;
    date: string;
    venue_name: string;
    venue_city?: string;
    lineup_text?: string; // lineup[].name 합친 텍스트 (50자 truncate)
    url: string; // /event/{id}
}

// ============================================
// Unified Search Response
// ============================================

export interface UnifiedSearchResult {
    query: string;
    results: {
        artists: { total_count: number; items: SearchArtistItem[] };
        venues: { total_count: number; items: SearchVenueItem[] };
        events: { total_count: number; items: SearchEventItem[] };
    };
}

// ============================================
// Category Search Response
// ============================================

export interface CategorySearchResult<T> {
    query: string;
    category: string;
    total_count: number;
    page: number;
    limit: number;
    has_next: boolean;
    items: T[];
}
