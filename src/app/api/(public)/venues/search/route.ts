// app/api/venues/search/route.ts
import { NextResponse } from 'next/server';

import { isSuccess } from '@/types/result';
import { searchVenues, searchVenuesBasic } from '@/lib/db/queries/venue.queries';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

        if (query.length < 1) {
            return NextResponse.json({ data: [] });
        }

        // RPC 함수로 이벤트 수 포함 검색 시도
        const result = await searchVenues(query, limit);

        if (isSuccess(result)) {
            return NextResponse.json({ data: result.data });
        }

        // RPC 실패 시 기본 쿼리로 fallback
        console.warn('searchVenues RPC failed, falling back to basic query:', result.error);
        const fallbackResult = await searchVenuesBasic(query, limit);

        if (isSuccess(fallbackResult)) {
            // 기본 쿼리 결과에 event_count: 0 추가
            const dataWithCount = fallbackResult.data.map((venue) => ({
                ...venue,
                event_count: 0,
            }));
            return NextResponse.json({ data: dataWithCount });
        }

        return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
    } catch (err) {
        console.error('GET /api/venues/search error:', err);
        return NextResponse.json({ error: '베뉴 검색 실패' }, { status: 500 });
    }
}
