// app/api/components/route.ts
import { createComponent, getMaxPosition } from '@/lib/db/queries/component.queries';
import { mapComponentToDatabase } from '@/lib/mappers/user.mapper';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';
import type { ComponentData } from '@/types/domain';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pageId, component } = body as { pageId: string; component: ComponentData };

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
        const dbComponent = mapComponentToDatabase(component, newPosition);

        const result = await createComponent(component.id, {
            page_id: pageId,
            type: dbComponent.type,
            position: dbComponent.position,
            data: dbComponent.data,
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
