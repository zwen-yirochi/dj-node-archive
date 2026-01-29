// app/api/components/[id]/route.ts
import { updateComponent, deleteComponent } from '@/lib/db/queries/component.queries';
import { mapComponentToDatabase } from '@/lib/mappers/user.mapper';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';
import type { ComponentData } from '@/types/domain';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { component } = body as { component: ComponentData };

        if (!component) {
            return NextResponse.json({ error: 'component가 필요합니다.' }, { status: 400 });
        }

        // position은 유지하면서 type과 data만 업데이트
        const dbComponent = mapComponentToDatabase(component, 0);

        const result = await updateComponent(id, {
            type: dbComponent.type,
            data: dbComponent.data,
        });

        if (!isSuccess(result)) {
            const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
            return NextResponse.json({ error: result.error.message }, { status });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (err) {
        console.error('PATCH /api/components/[id] error:', err);
        return NextResponse.json({ error: '컴포넌트 수정 실패' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const result = await deleteComponent(id);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/components/[id] error:', err);
        return NextResponse.json({ error: '컴포넌트 삭제 실패' }, { status: 500 });
    }
}
