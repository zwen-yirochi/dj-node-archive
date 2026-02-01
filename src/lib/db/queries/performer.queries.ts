// lib/db/queries/performer.queries.ts
import { createClient } from '@/lib/supabase/server';
import type { DBArtistReference, DBEventPerformer, PerformanceType } from '@/types/database';

export type AddPerformerInput = {
    event_id: string;
    user_id?: string;
    artist_ref_id?: string;
    performance_type?: PerformanceType;
};

export type PerformerWithDetails = DBEventPerformer & {
    user?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
    artist?: DBArtistReference;
};

export type PerformerResult =
    | { success: true; data: DBEventPerformer }
    | { success: false; error: string };

export type PerformersResult =
    | { success: true; data: PerformerWithDetails[] }
    | { success: false; error: string };

/**
 * 이벤트에 퍼포머 추가
 */
export async function addPerformerToEvent(input: AddPerformerInput): Promise<PerformerResult> {
    const supabase = await createClient();

    // user_id 또는 artist_ref_id 중 하나만 있어야 함
    if (!input.user_id && !input.artist_ref_id) {
        return { success: false, error: 'user_id 또는 artist_ref_id가 필요합니다' };
    }
    if (input.user_id && input.artist_ref_id) {
        return { success: false, error: 'user_id와 artist_ref_id 중 하나만 지정해야 합니다' };
    }

    const { data, error } = await supabase
        .from('event_performers')
        .insert({
            event_id: input.event_id,
            user_id: input.user_id || null,
            artist_ref_id: input.artist_ref_id || null,
            performance_type: input.performance_type || 'dj_set',
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as DBEventPerformer };
}

/**
 * 이벤트의 퍼포머 목록 조회
 */
export async function findPerformersByEventId(eventId: string): Promise<PerformersResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('event_performers')
        .select(
            `
            *,
            user:users(id, username, display_name, avatar_url),
            artist:artist_references(*)
        `
        )
        .eq('event_id', eventId)
        .order('created_at');

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as PerformerWithDetails[] };
}

/**
 * 퍼포머 삭제
 */
export async function removePerformer(
    performerId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const supabase = await createClient();

    const { error } = await supabase.from('event_performers').delete().eq('id', performerId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 유저가 참여한 이벤트 목록 조회
 */
export async function findEventsByPerformerId(
    userId: string
): Promise<{ success: true; data: DBEventPerformer[] } | { success: false; error: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('event_performers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as DBEventPerformer[] };
}

/**
 * 이벤트의 퍼포머 업데이트 (전체 교체)
 */
export async function updateEventPerformers(
    eventId: string,
    performers: Array<{
        user_id?: string;
        artist_ref_id?: string;
        performance_type?: PerformanceType;
    }>
): Promise<PerformersResult> {
    const supabase = await createClient();

    // 기존 퍼포머 삭제
    const { error: deleteError } = await supabase
        .from('event_performers')
        .delete()
        .eq('event_id', eventId);

    if (deleteError) {
        return { success: false, error: deleteError.message };
    }

    // 새 퍼포머 없으면 빈 배열 반환
    if (performers.length === 0) {
        return { success: true, data: [] };
    }

    // 새 퍼포머 추가
    const insertData = performers.map((p) => ({
        event_id: eventId,
        user_id: p.user_id || null,
        artist_ref_id: p.artist_ref_id || null,
        performance_type: p.performance_type || 'dj_set',
    }));

    const { error: insertError } = await supabase.from('event_performers').insert(insertData);

    if (insertError) {
        return { success: false, error: insertError.message };
    }

    // 새로 추가된 퍼포머 조회
    return findPerformersByEventId(eventId);
}
