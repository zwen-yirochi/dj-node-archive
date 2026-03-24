// lib/db/queries/event.queries.ts
// 서버 전용 - 이벤트 관련 DB 쿼리
import type { Event, EventData, EventPerformer, EventVenue } from '@/types/database';
import {
    createDatabaseError,
    createForbiddenError,
    createNotFoundError,
    failure,
    success,
    type Result,
} from '@/types/result';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Input Types
// ============================================

export interface CreateEventInput {
    title: string;
    slug: string;
    date: string;
    venue: EventVenue;
    lineup?: EventPerformer[];
    data?: EventData;
    is_public?: boolean;
    created_by: string;
}

export interface UpdateEventInput {
    title?: string;
    slug?: string;
    date?: string;
    venue?: EventVenue;
    lineup?: EventPerformer[];
    data?: EventData;
    is_public?: boolean;
}

// ============================================
// Create
// ============================================

export async function createEvent(input: CreateEventInput): Promise<Result<Event>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .insert({
                title: input.title,
                slug: input.slug,
                date: input.date,
                venue: input.venue,
                lineup: input.lineup || [],
                data: input.data || {},
                is_public: input.is_public ?? false,
                created_by: input.created_by,
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

export async function findEventById(eventId: string): Promise<Result<Event>> {
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

export async function findEventBySlug(slug: string): Promise<Result<Event>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError(`이벤트 '${slug}'를 찾을 수 없습니다.`, 'event')
                );
            }
            return failure(createDatabaseError(error.message, 'findEventBySlug', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 조회 중 오류가 발생했습니다.', 'findEventBySlug', err)
        );
    }
}

export async function findEventsByUserId(
    userId: string,
    limit: number = 50
): Promise<Result<Event[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('created_by', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByUserId', error));
        }

        return success(data || []);
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

export async function findPublicEvents(limit: number = 50): Promise<Result<Event[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('is_public', true)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findPublicEvents', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '공개 이벤트 목록 조회 중 오류가 발생했습니다.',
                'findPublicEvents',
                err
            )
        );
    }
}

/**
 * venue_id로 이벤트 검색 (JSONB 내부 검색)
 */
export async function findEventsByVenueId(
    venueId: string,
    limit: number = 50
): Promise<Result<Event[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('venue->>venue_id', venueId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByVenueId', error));
        }

        return success(data || []);
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

/**
 * artist_id로 이벤트 검색 (lineup JSONB 배열 검색)
 */
export async function findEventsByArtistId(
    artistId: string,
    limit: number = 50
): Promise<Result<Event[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .contains('lineup', [{ artist_id: artistId }])
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByArtistId', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '아티스트 이벤트 목록 조회 중 오류가 발생했습니다.',
                'findEventsByArtistId',
                err
            )
        );
    }
}

/**
 * stack_id로 이벤트 검색
 */
export async function findEventsByStackId(
    stackId: string,
    limit: number = 500
): Promise<Result<Event[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('stack_id', stackId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByStackId', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '스택 이벤트 목록 조회 중 오류가 발생했습니다.',
                'findEventsByStackId',
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
): Promise<Result<Event>> {
    try {
        const supabase = await createClient();

        // 먼저 이벤트 소유자 확인
        const { data: existing, error: findError } = await supabase
            .from('events')
            .select('created_by')
            .eq('id', eventId)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(findError.message, 'updateEvent', findError));
        }

        if (existing.created_by !== userId) {
            return failure(createForbiddenError('이벤트를 수정할 권한이 없습니다.'));
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.slug !== undefined) updateData.slug = input.slug;
        if (input.date !== undefined) updateData.date = input.date;
        if (input.venue !== undefined) updateData.venue = input.venue;
        if (input.lineup !== undefined) updateData.lineup = input.lineup;
        if (input.data !== undefined) updateData.data = input.data;
        if (input.is_public !== undefined) updateData.is_public = input.is_public;

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

// ============================================
// Helpers
// ============================================

/**
 * 이벤트 slug 생성
 * @example "summer-festival-2024-08-15"
 */
export function generateEventSlug(title: string, date: string): string {
    const dateStr = date.split('T')[0]; // YYYY-MM-DD
    const slugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slugBase}-${dateStr}-${Date.now().toString(36)}`;
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
            .select('created_by')
            .eq('id', eventId)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return failure(createNotFoundError('이벤트를 찾을 수 없습니다.', 'event'));
            }
            return failure(createDatabaseError(findError.message, 'deleteEvent', findError));
        }

        if (existing.created_by !== userId) {
            return failure(createForbiddenError('이벤트를 삭제할 권한이 없습니다.'));
        }

        // 관련 mentions 삭제
        await supabase
            .from('mentions')
            .delete()
            .eq('source_type', 'event')
            .eq('source_id', eventId);

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
