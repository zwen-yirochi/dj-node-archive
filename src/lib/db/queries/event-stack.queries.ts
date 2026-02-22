// lib/db/queries/event-stack.queries.ts
// 서버 전용 - Event Stack 관련 DB 쿼리

import { createClient } from '@/lib/supabase/server';
import type { EventStack } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

/**
 * 이벤트 스택 upsert (venue_id + title 기준)
 * functional index (lower(title)) 때문에 수동 select → insert/update 방식
 */
export async function upsertEventStack(
    venueId: string,
    title: string,
    eventCount: number,
    firstDate: string | null,
    lastDate: string | null
): Promise<Result<EventStack>> {
    try {
        const supabase = await createClient();

        // 기존 스택 조회 (case-insensitive)
        const { data: existing, error: selectError } = await supabase
            .from('event_stacks')
            .select('*')
            .eq('venue_id', venueId)
            .ilike('title', title)
            .maybeSingle();

        if (selectError) {
            return failure(
                createDatabaseError(selectError.message, 'upsertEventStack', selectError)
            );
        }

        if (existing) {
            const { data, error } = await supabase
                .from('event_stacks')
                .update({
                    event_count: eventCount,
                    first_event_date: firstDate,
                    last_event_date: lastDate,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                return failure(createDatabaseError(error.message, 'upsertEventStack', error));
            }
            return success(data);
        }

        const { data, error } = await supabase
            .from('event_stacks')
            .insert({
                venue_id: venueId,
                title,
                event_count: eventCount,
                first_event_date: firstDate,
                last_event_date: lastDate,
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'upsertEventStack', error));
        }
        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 스택 생성 중 오류가 발생했습니다.', 'upsertEventStack', err)
        );
    }
}

/**
 * 스택 ID로 이벤트 스택 조회
 */
export async function findStackById(id: string): Promise<Result<EventStack>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('event_stacks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError('이벤트 스택을 찾을 수 없습니다.', 'event_stack')
                );
            }
            return failure(createDatabaseError(error.message, 'findStackById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 스택 조회 중 오류가 발생했습니다.', 'findStackById', err)
        );
    }
}

/**
 * 베뉴의 모든 이벤트 스택 조회
 */
export async function findStacksByVenueId(venueId: string): Promise<Result<EventStack[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('event_stacks')
            .select('*')
            .eq('venue_id', venueId)
            .order('event_count', { ascending: false });

        if (error) {
            return failure(createDatabaseError(error.message, 'findStacksByVenueId', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 스택 조회 중 오류가 발생했습니다.',
                'findStacksByVenueId',
                err
            )
        );
    }
}

/**
 * 이벤트에 stack_id 배치 할당
 */
export async function assignStackToEvents(
    eventIds: string[],
    stackId: string
): Promise<Result<void>> {
    if (eventIds.length === 0) return success(undefined);

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('events')
            .update({ stack_id: stackId })
            .in('id', eventIds);

        if (error) {
            return failure(createDatabaseError(error.message, 'assignStackToEvents', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 스택 할당 중 오류가 발생했습니다.',
                'assignStackToEvents',
                err
            )
        );
    }
}

/**
 * 스택 집계 데이터 갱신 (event_count, first/last_event_date)
 */
export async function refreshStackSummary(stackId: string): Promise<Result<EventStack>> {
    try {
        const supabase = await createClient();

        // 스택에 속한 이벤트들로부터 집계 조회
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('date')
            .eq('stack_id', stackId)
            .order('date', { ascending: true });

        if (eventsError) {
            return failure(
                createDatabaseError(eventsError.message, 'refreshStackSummary', eventsError)
            );
        }

        const count = events?.length ?? 0;
        const firstDate = events?.[0]?.date ?? null;
        const lastDate = events?.[count - 1]?.date ?? null;

        const { data, error } = await supabase
            .from('event_stacks')
            .update({
                event_count: count,
                first_event_date: firstDate,
                last_event_date: lastDate,
                updated_at: new Date().toISOString(),
            })
            .eq('id', stackId)
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'refreshStackSummary', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                '이벤트 스택 갱신 중 오류가 발생했습니다.',
                'refreshStackSummary',
                err
            )
        );
    }
}
