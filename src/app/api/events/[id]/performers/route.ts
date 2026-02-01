// app/api/events/[id]/performers/route.ts
import { findEventById } from '@/lib/db/queries/event.queries';
import {
    addPerformerToEvent,
    findPerformersByEventId,
    updateEventPerformers,
} from '@/lib/db/queries/performer.queries';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { PerformanceType } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/events/[id]/performers
 * 이벤트의 퍼포머 목록 조회
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;

    const result = await findPerformersByEventId(id);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
}

/**
 * POST /api/events/[id]/performers
 * 이벤트에 퍼포머 추가
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // 이벤트 소유자 확인
    const eventResult = await findEventById(eventId);
    if (!eventResult.success) {
        return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 });
    }

    if (eventResult.data.user_id !== user.id) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { user_id, artist_ref_id, performance_type } = body;

        const result = await addPerformerToEvent({
            event_id: eventId,
            user_id,
            artist_ref_id,
            performance_type,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ data: result.data });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

/**
 * PUT /api/events/[id]/performers
 * 이벤트의 퍼포머 전체 교체
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // 이벤트 소유자 확인
    const eventResult = await findEventById(eventId);
    if (!eventResult.success) {
        return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 });
    }

    if (eventResult.data.user_id !== user.id) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const performers: Array<{
            user_id?: string;
            artist_ref_id?: string;
            performance_type?: PerformanceType;
        }> = body.performers || [];

        const result = await updateEventPerformers(eventId, performers);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ data: result.data });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
