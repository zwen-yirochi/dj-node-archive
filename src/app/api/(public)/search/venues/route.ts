// app/api/(public)/search/venues/route.ts - 베뉴 카테고리 검색 API
import { NextResponse } from 'next/server';
import { searchVenuesWithCount } from '@/lib/db/queries/search.queries';
import { isSuccess } from '@/types/result';
import type { CategorySearchResult, SearchVenueItem } from '@/types/search';

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

        if (query.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: '검색어는 2자 이상이어야 합니다.' },
                },
                { status: 400 }
            );
        }

        const result = await searchVenuesWithCount(query, limit, offset);

        if (!isSuccess(result)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: result.error.message },
                },
                { status: 500 }
            );
        }

        const data: CategorySearchResult<SearchVenueItem> = {
            query,
            category: 'venues',
            total_count: result.data.total_count,
            page,
            limit,
            has_next: offset + limit < result.data.total_count,
            items: result.data.items,
        };

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/search/venues error:', err);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: '베뉴 검색 중 오류가 발생했습니다.' },
            },
            { status: 500 }
        );
    }
}
