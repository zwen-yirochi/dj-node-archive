// app/api/components/route.ts
import { createComponent, getMaxPosition } from '@/lib/db/queries/component.queries';
import { createClient } from '@/lib/supabase/server';
import { mapEntryToDatabase } from '@/lib/mappers/user.mapper';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';
import type { ContentEntry } from '@/types/domain';

export async function POST(request: Request) {
    try {
        // 인증 확인
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { pageId, component } = body as { pageId: string; component: ContentEntry };

        if (!pageId || !component) {
            return NextResponse.json(
                { error: 'pageId와 component가 필요합니다.' },
                { status: 400 }
            );
        }

        // 최대 position 조회
        const maxPositionResult = await getMaxPosition(pageId);
        if (!isSuccess(maxPositionResult)) {
            return NextResponse.json({ error: maxPositionResult.error.message }, { status: 500 });
        }

        const newPosition = maxPositionResult.data + 1;
        const dbEntry = mapEntryToDatabase(component, newPosition);

        const result = await createComponent(component.id, {
            page_id: pageId,
            type: dbEntry.type,
            position: dbEntry.position,
            data: dbEntry.data,
        });

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('POST /api/components error:', err);
        return NextResponse.json({ error: '컴포넌트 생성 실패' }, { status: 500 });
    }
}
