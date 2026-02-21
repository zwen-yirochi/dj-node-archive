// app/api/(public)/search/route.ts - 통합 검색 API
import { NextResponse } from 'next/server';
import { searchUsers, searchVenuesWithCount, searchEvents } from '@/lib/db/queries/search.queries';
import { isSuccess } from '@/types/result';
import type { UnifiedSearchResult } from '@/types/search';

const UNIFIED_LIMIT = 10;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = (searchParams.get('q') || '').trim();

        if (query.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: '검색어는 2자 이상이어야 합니다.' },
                },
                { status: 400 }
            );
        }

        if (query.length > 100) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: '검색어는 100자 이하여야 합니다.' },
                },
                { status: 400 }
            );
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

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('GET /api/search error:', err);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: '검색 중 오류가 발생했습니다.' },
            },
            { status: 500 }
        );
    }
}
