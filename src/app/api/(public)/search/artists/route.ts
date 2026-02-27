// app/api/(public)/search/artists/route.ts - 아티스트 카테고리 검색 API
import { successResponse, internalErrorResponse } from '@/lib/api';
import { searchUsers } from '@/lib/db/queries/search.queries';
import { isSuccess } from '@/types/result';
import type { CategorySearchResult, SearchArtistItem } from '@/types/search';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
        Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))),
        MAX_LIMIT
    );
    const offset = (page - 1) * limit;

    const result = await searchUsers(query, limit, offset);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    const data: CategorySearchResult<SearchArtistItem> = {
        query,
        category: 'artists',
        total_count: result.data.total_count,
        page,
        limit,
        has_next: offset + limit < result.data.total_count,
        items: result.data.items,
    };

    return successResponse(data);
}
