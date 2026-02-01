// lib/db/queries/event.queries.ts
// 서버 전용 - 이벤트 관련 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { DBEvent, DBEventWithVenue } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
    createForbiddenError,
} from '@/types/result';

// ============================================
// Input Types
// ============================================

export interface CreateEventInput {
    user_id: string;
    venue_ref_id: string;
    title?: string;
    date: string;
    data?: {
        poster_url?: string;
        notes?: string;
        set_recording_url?: string;
        lineup_text?: string;
    };
}

export interface UpdateEventInput {
    venue_ref_id?: string;
    title?: string;
    date?: string;
    data?: {
        poster_url?: string;
        notes?: string;
        set_recording_url?: string;
        lineup_text?: string;
    };
}

// ============================================
// Create
// ============================================

export async function createEvent(input: CreateEventInput): Promise<Result<DBEvent>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .insert({
                user_id: input.user_id,
                venue_ref_id: input.venue_ref_id,
                title: input.title,
                date: input.date,
                data: input.data || {},
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createEvent', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 생성 중 오류가 발생했습니다.', 'createEvent', err)
        );
    }
}

// ============================================
// Read
// ============================================

export async function findEventById(eventId: string): Promise<Result<DBEvent>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(error.message, 'findEventById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 조회 중 오류가 발생했습니다.', 'findEventById', err)
        );
    }
}

export async function findEventWithVenueById(eventId: string): Promise<Result<DBEventWithVenue>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select(
                `
                *,
                venue:venue_references(*)
            `
            )
            .eq('id', eventId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(error.message, 'findEventWithVenueById', error));
        }

        return success(data as DBEventWithVenue);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 조회 중 오류가 발생했습니다.',
                'findEventWithVenueById',
                err
            )
        );
    }
}

export async function findEventsByUserId(
    userId: string,
    limit: number = 50
): Promise<Result<DBEventWithVenue[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select(
                `
                *,
                venue:venue_references(*)
            `
            )
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByUserId', error));
        }

        return success((data as DBEventWithVenue[]) || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 목록 조회 중 오류가 발생했습니다.',
                'findEventsByUserId',
                err
            )
        );
    }
}

export async function findEventsByVenueId(
    venueId: string,
    limit: number = 50
): Promise<Result<DBEventWithVenue[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select(
                `
                *,
                venue:venue_references(*)
            `
            )
            .eq('venue_ref_id', venueId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByVenueId', error));
        }

        return success((data as DBEventWithVenue[]) || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '베뉴 이벤트 목록 조회 중 오류가 발생했습니다.',
                'findEventsByVenueId',
                err
            )
        );
    }
}

// ============================================
// Update
// ============================================

export async function updateEvent(
    eventId: string,
    userId: string,
    input: UpdateEventInput
): Promise<Result<DBEvent>> {
    try {
        const supabase = await createClient();

        // 먼저 이벤트 소유자 확인
        const { data: existing, error: findError } = await supabase
            .from('events')
            .select('user_id')
            .eq('id', eventId)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(findError.message, 'updateEvent', findError));
        }

        if (existing.user_id !== userId) {
            return failure(createForbiddenError('이벤트를 수정할 권한이 없습니다.'));
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.venue_ref_id !== undefined) updateData.venue_ref_id = input.venue_ref_id;
        if (input.title !== undefined) updateData.title = input.title;
        if (input.date !== undefined) updateData.date = input.date;
        if (input.data !== undefined) updateData.data = input.data;

        const { data, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', eventId)
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'updateEvent', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 수정 중 오류가 발생했습니다.', 'updateEvent', err)
        );
    }
}

// ============================================
// Delete
// ============================================

export async function deleteEvent(eventId: string, userId: string): Promise<Result<void>> {
    try {
        const supabase = await createClient();

        // 먼저 이벤트 소유자 확인
        const { data: existing, error: findError } = await supabase
            .from('events')
            .select('user_id')
            .eq('id', eventId)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(findError.message, 'deleteEvent', findError));
        }

        if (existing.user_id !== userId) {
            return failure(createForbiddenError('이벤트를 삭제할 권한이 없습니다.'));
        }

        // 관련 event_performers 먼저 삭제
        await supabase.from('event_performers').delete().eq('event_id', eventId);

        const { error } = await supabase.from('events').delete().eq('id', eventId);

        if (error) {
            return failure(createDatabaseError(error.message, 'deleteEvent', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 삭제 중 오류가 발생했습니다.', 'deleteEvent', err)
        );
    }
}
