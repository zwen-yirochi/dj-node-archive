// lib/db/queries/search.queries.ts
// 서버 전용 - 통합 검색 DB 쿼리
import type { Event } from '@/types/database';
import { createDatabaseError, failure, success, type Result } from '@/types/result';
import type { SearchArtistItem, SearchEventItem, SearchVenueItem } from '@/types/search';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Relevance Sorting
// ============================================

function sortByRelevance<T>(items: T[], query: string, getFields: (item: T) => string[]): T[] {
    const lowerQuery = query.toLowerCase();

    return items.sort((a, b) => {
        const aFields = getFields(a).map((f) => f.toLowerCase());
        const bFields = getFields(b).map((f) => f.toLowerCase());

        const aExact = aFields.some((f) => f === lowerQuery);
        const bExact = bFields.some((f) => f === lowerQuery);
        if (aExact !== bExact) return aExact ? -1 : 1;

        const aPrefix = aFields.some((f) => f.startsWith(lowerQuery));
        const bPrefix = bFields.some((f) => f.startsWith(lowerQuery));
        if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;

        return 0;
    });
}

// ============================================
// User Search
// ============================================

interface UserSearchRaw {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string;
}

export async function searchUsers(
    query: string,
    limit: number = 10,
    offset: number = 0
): Promise<Result<{ items: SearchArtistItem[]; total_count: number }>> {
    try {
        const supabase = await createClient();

        const baseQuery = supabase
            .from('users')
            .select('id, username, display_name, avatar_url', { count: 'exact' })
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);

        const { data, error, count } = await baseQuery
            .order('username')
            .range(offset, offset + limit - 1);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchUsers', error));
        }

        const raw = (data || []) as UserSearchRaw[];
        const items: SearchArtistItem[] = raw.map((u) => ({
            id: u.id,
            username: u.username,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url,
            url: `/${u.username}`,
        }));

        const sorted = sortByRelevance(
            items,
            query,
            (item) => [item.username, item.display_name].filter(Boolean) as string[]
        );

        return success({ items: sorted, total_count: count ?? 0 });
    } catch (err) {
        return failure(
            createDatabaseError('유저 검색 중 오류가 발생했습니다.', 'searchUsers', err)
        );
    }
}

// ============================================
// Venue Search (with count)
// ============================================

export async function searchVenuesWithCount(
    query: string,
    limit: number = 10,
    offset: number = 0
): Promise<Result<{ items: SearchVenueItem[]; total_count: number }>> {
    try {
        const supabase = await createClient();
        const searchPattern = `%${query}%`;

        // RPC로 event_count 포함 검색 시도
        const { data: rpcData, error: rpcError } = await supabase.rpc(
            'search_venues_with_event_count',
            {
                search_query: searchPattern,
                result_limit: limit + offset, // offset 포함해서 가져온 뒤 slice
            }
        );

        if (!rpcError && rpcData) {
            const sliced = rpcData.slice(offset, offset + limit);
            const items: SearchVenueItem[] = sliced.map(
                (v: {
                    id: string;
                    name: string;
                    slug: string;
                    city?: string;
                    event_count: number;
                }) => ({
                    id: v.id,
                    name: v.name,
                    slug: v.slug,
                    city: v.city,
                    event_count: v.event_count ?? 0,
                    url: `/venues/${v.slug}`,
                })
            );

            const sorted = sortByRelevance(
                items,
                query,
                (item) => [item.name, item.city].filter(Boolean) as string[]
            );

            return success({ items: sorted, total_count: rpcData.length });
        }

        // Fallback: 기본 ILIKE 쿼리
        const { data, error, count } = await supabase
            .from('venues')
            .select('id, name, slug, city', { count: 'exact' })
            .or(`name.ilike.${searchPattern},city.ilike.${searchPattern}`)
            .order('name')
            .range(offset, offset + limit - 1);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchVenuesWithCount', error));
        }

        const items: SearchVenueItem[] = (data || []).map((v) => ({
            id: v.id,
            name: v.name,
            slug: v.slug,
            city: v.city ?? undefined,
            event_count: 0,
            url: `/venues/${v.slug}`,
        }));

        const sorted = sortByRelevance(
            items,
            query,
            (item) => [item.name, item.city].filter(Boolean) as string[]
        );

        return success({ items: sorted, total_count: count ?? 0 });
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 검색 중 오류가 발생했습니다.', 'searchVenuesWithCount', err)
        );
    }
}

// ============================================
// Event Search
// ============================================

function formatLineupText(lineup: { name: string }[]): string | undefined {
    if (!lineup || lineup.length === 0) return undefined;
    const text = lineup.map((p) => p.name).join(', ');
    return text.length > 50 ? text.slice(0, 47) + '...' : text;
}

export async function searchEvents(
    query: string,
    limit: number = 10,
    offset: number = 0
): Promise<Result<{ items: SearchEventItem[]; total_count: number }>> {
    try {
        const supabase = await createClient();

        let dbQuery = supabase
            .from('events')
            .select('id, title, date, venue, lineup, is_public', { count: 'exact' })
            .eq('is_public', true);

        // 검색어가 있으면 title ILIKE 필터 적용
        if (query) {
            dbQuery = dbQuery.ilike('title', `%${query}%`);
        }

        const { data, error, count } = await dbQuery
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchEvents', error));
        }

        const raw = (data || []) as Pick<
            Event,
            'id' | 'title' | 'date' | 'venue' | 'lineup' | 'is_public'
        >[];

        let items: SearchEventItem[] = raw.map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            venue_name: e.venue?.name || '',
            venue_city: undefined,
            lineup_text: formatLineupText(e.lineup || []),
            url: `/event/${e.id}`,
        }));

        // lineup 텍스트 매칭은 JS에서 처리 (PostgREST에서 JSONB cast 불가)
        if (query) {
            const lowerQuery = query.toLowerCase();
            items = items.filter(
                (e) =>
                    e.title.toLowerCase().includes(lowerQuery) ||
                    (e.lineup_text && e.lineup_text.toLowerCase().includes(lowerQuery))
            );
        }

        if (query) {
            sortByRelevance(
                items,
                query,
                (item) => [item.title, item.lineup_text].filter(Boolean) as string[]
            );
        }

        return success({ items, total_count: count ?? 0 });
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 검색 중 오류가 발생했습니다.', 'searchEvents', err)
        );
    }
}
