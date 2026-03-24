// app/api/(public)/search/route.ts - 통합 검색 API
import { isSuccess } from '@/types/result';
import type { UnifiedSearchResult } from '@/types/search';
import { internalErrorResponse, successResponse, validationErrorResponse } from '@/lib/api';
import { searchEvents, searchUsers, searchVenuesWithCount } from '@/lib/db/queries/search.queries';

const UNIFIED_LIMIT = 10;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 2) {
        return validationErrorResponse('검색어 (2자 이상)');
    }

    if (query.length > 100) {
        return validationErrorResponse('검색어 (100자 이하)');
    }

    const [usersResult, venuesResult, eventsResult] = await Promise.allSettled([
        searchUsers(query, UNIFIED_LIMIT),
        searchVenuesWithCount(query, UNIFIED_LIMIT),
        searchEvents(query, UNIFIED_LIMIT),
    ]);

    const artists =
        usersResult.status === 'fulfilled' && isSuccess(usersResult.value)
            ? usersResult.value.data
            : { items: [], total_count: 0 };

    const venues =
        venuesResult.status === 'fulfilled' && isSuccess(venuesResult.value)
            ? venuesResult.value.data
            : { items: [], total_count: 0 };

    const events =
        eventsResult.status === 'fulfilled' && isSuccess(eventsResult.value)
            ? eventsResult.value.data
            : { items: [], total_count: 0 };

    const data: UnifiedSearchResult = {
        query,
        results: { artists, venues, events },
    };

    return successResponse(data);
}
