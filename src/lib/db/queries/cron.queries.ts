// lib/db/queries/cron.queries.ts
// Cron 전용 DB 쿼리 — Service role 클라이언트를 파라미터로 받음

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Event, EventStack, Venue } from '@/types/database';
import { createDatabaseError, failure, success, type Result } from '@/types/result';
import type { CreateImportedEventInput } from '@/lib/mappers';

/**
 * RA import된 모든 베뉴 조회
 */
export async function findAllRAVenues(supabase: SupabaseClient): Promise<Result<Venue[]>> {
    try {
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('source', 'ra_import')
            .not('external_sources->>ra_venue_id', 'is', null);

        if (error) {
            return failure(createDatabaseError(error.message, 'findAllRAVenues', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('RA 베뉴 조회 중 오류가 발생했습니다.', 'findAllRAVenues', err)
        );
    }
}

/**
 * 베뉴의 기존 RA 이벤트 ID 조회 (중복 방지)
 */
export async function findExistingRAEventIds(
    supabase: SupabaseClient,
    venueId: string
): Promise<Result<Set<string>>> {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('data')
            .eq('venue->>venue_id', venueId)
            .eq('source', 'ra_import');

        if (error) {
            return failure(createDatabaseError(error.message, 'findExistingRAEventIds', error));
        }

        const ids = new Set<string>();
        for (const event of data || []) {
            const raEventId = (event.data as Record<string, unknown>)?.ra_event_id;
            if (typeof raEventId === 'string') {
                ids.add(raEventId);
            }
        }

        return success(ids);
    } catch (err) {
        return failure(
            createDatabaseError(
                '기존 이벤트 ID 조회 중 오류가 발생했습니다.',
                'findExistingRAEventIds',
                err
            )
        );
    }
}

/**
 * 원래 import한 유저 ID 조회 (import_logs에서)
 */
export async function findOriginalImporter(
    supabase: SupabaseClient,
    venueId: string
): Promise<Result<string | null>> {
    try {
        const { data, error } = await supabase
            .from('import_logs')
            .select('user_id')
            .eq('venue_id', venueId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findOriginalImporter', error));
        }

        return success(data?.user_id ?? null);
    } catch (err) {
        return failure(
            createDatabaseError(
                '원래 import 유저 조회 중 오류가 발생했습니다.',
                'findOriginalImporter',
                err
            )
        );
    }
}

/**
 * 이벤트 배치 삽입 (service client)
 */
export async function insertEvents(
    supabase: SupabaseClient,
    events: CreateImportedEventInput[]
): Promise<Result<Event[]>> {
    if (events.length === 0) return success([]);

    try {
        const { data, error } = await supabase.from('events').insert(events).select();

        if (error) {
            return failure(createDatabaseError(error.message, 'insertEvents', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 생성 중 오류가 발생했습니다.', 'insertEvents', err)
        );
    }
}

/**
 * 이벤트 스택 upsert (service client)
 * functional index (lower(title)) 때문에 수동 select → insert/update 방식
 */
export async function upsertStack(
    supabase: SupabaseClient,
    venueId: string,
    title: string
): Promise<Result<EventStack>> {
    try {
        // 기존 스택 조회 (case-insensitive)
        const { data: existing, error: selectError } = await supabase
            .from('event_stacks')
            .select('*')
            .eq('venue_id', venueId)
            .ilike('title', title)
            .maybeSingle();

        if (selectError) {
            return failure(createDatabaseError(selectError.message, 'upsertStack', selectError));
        }

        if (existing) {
            // 이미 존재하면 updated_at만 갱신
            const { data, error } = await supabase
                .from('event_stacks')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                return failure(createDatabaseError(error.message, 'upsertStack', error));
            }
            return success(data);
        }

        // 새로 생성
        const { data, error } = await supabase
            .from('event_stacks')
            .insert({ venue_id: venueId, title })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'upsertStack', error));
        }
        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 스택 upsert 중 오류가 발생했습니다.', 'upsertStack', err)
        );
    }
}

/**
 * 스택 집계 갱신 (service client)
 */
export async function refreshStackStats(
    supabase: SupabaseClient,
    stackId: string
): Promise<Result<void>> {
    try {
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('date')
            .eq('stack_id', stackId)
            .order('date', { ascending: true });

        if (eventsError) {
            return failure(
                createDatabaseError(eventsError.message, 'refreshStackStats', eventsError)
            );
        }

        const count = events?.length ?? 0;
        const firstDate = events?.[0]?.date ?? null;
        const lastDate = events?.[count - 1]?.date ?? null;

        const { error } = await supabase
            .from('event_stacks')
            .update({
                event_count: count,
                first_event_date: firstDate,
                last_event_date: lastDate,
                updated_at: new Date().toISOString(),
            })
            .eq('id', stackId);

        if (error) {
            return failure(createDatabaseError(error.message, 'refreshStackStats', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 스택 집계 갱신 중 오류가 발생했습니다.',
                'refreshStackStats',
                err
            )
        );
    }
}
