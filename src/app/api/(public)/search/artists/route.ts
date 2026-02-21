// app/api/(public)/search/artists/route.ts - 아티스트 카테고리 검색 API
import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/db/queries/search.queries';
import { isSuccess } from '@/types/result';
import type { CategorySearchResult, SearchArtistItem } from '@/types/search';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
    try {
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
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: result.error.message },
                },
                { status: 500 }
            );
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

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/search/artists error:', err);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: '아티스트 검색 중 오류가 발생했습니다.' },
            },
            { status: 500 }
        );
    }
}
