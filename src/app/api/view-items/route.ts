// app/api/view-items/route.ts
import {
    getViewItemsByPageId,
    addViewItem,
    getMaxViewItemOrderIndex,
} from '@/lib/db/queries/page-view.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

// GET /api/view-items?pageId=xxx - 페이지의 view items 조회
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('pageId');

        if (!pageId) {
            return NextResponse.json({ error: 'pageId가 필요합니다.' }, { status: 400 });
        }

        const result = await getViewItemsByPageId(pageId);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('GET /api/view-items error:', err);
        return NextResponse.json({ error: 'View items 조회 실패' }, { status: 500 });
    }
}

// POST /api/view-items - View에 컴포넌트 추가
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { pageId, componentId, orderIndex } = body as {
            pageId: string;
            componentId: string;
            orderIndex?: number;
        };

        if (!pageId || !componentId) {
            return NextResponse.json(
                { error: 'pageId와 componentId가 필요합니다.' },
                { status: 400 }
            );
        }

        // orderIndex가 제공되지 않으면 자동 계산
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined) {
            const maxResult = await getMaxViewItemOrderIndex(pageId);
            if (!isSuccess(maxResult)) {
                return NextResponse.json({ error: maxResult.error.message }, { status: 500 });
            }
            finalOrderIndex = maxResult.data + 1;
        }

        const result = await addViewItem(pageId, componentId, finalOrderIndex);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('POST /api/view-items error:', err);
        return NextResponse.json({ error: 'View item 추가 실패' }, { status: 500 });
    }
}
