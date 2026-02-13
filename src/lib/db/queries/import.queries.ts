// lib/db/queries/import.queries.ts
// 서버 전용 - Import 관련 DB 쿼리

import { createClient } from '@/lib/supabase/server';
import type { Venue, Event } from '@/types/database';
import type { CreateImportedVenueInput, CreateImportedEventInput } from '@/lib/mappers';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createConflictError,
} from '@/types/result';

export type { CreateImportedVenueInput, CreateImportedEventInput };

// ============================================
// Venue Queries
// ============================================

/**
 * RA URL로 기존 베뉴 조회 (중복 체크)
 */
export async function findVenueByRAUrl(raUrl: string): Promise<Result<Venue | null>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('external_sources->>ra_url', raUrl)
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findVenueByRAUrl', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 조회 중 오류가 발생했습니다.', 'findVenueByRAUrl', err)
        );
    }
}

/**
 * Import된 베뉴 생성
 */
export async function createImportedVenue(input: CreateImportedVenueInput): Promise<Result<Venue>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('venues').insert(input).select().single();

        if (error) {
            if (error.code === '23505') {
                return failure(createConflictError('이미 등록된 베뉴입니다.', 'venue'));
            }
            return failure(createDatabaseError(error.message, 'createImportedVenue', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 생성 중 오류가 발생했습니다.', 'createImportedVenue', err)
        );
    }
}

// ============================================
// Event Queries
// ============================================

/**
 * Import된 이벤트 배치 생성
 */
export async function createImportedEvents(
    events: CreateImportedEventInput[]
): Promise<Result<Event[]>> {
    if (events.length === 0) return success([]);

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('events').insert(events).select();

        if (error) {
            return failure(createDatabaseError(error.message, 'createImportedEvents', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 생성 중 오류가 발생했습니다.', 'createImportedEvents', err)
        );
    }
}

// ============================================
// Rate Limit Queries
// ============================================

/**
 * 유저별 최근 N시간 내 Import 횟수 조회
 */
export async function countUserImportsInWindow(
    userId: string,
    hours: number
): Promise<Result<number>> {
    try {
        const supabase = await createClient();
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('import_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', since);

        if (error) {
            return failure(createDatabaseError(error.message, 'countUserImportsInWindow', error));
        }

        return success(count ?? 0);
    } catch (err) {
        return failure(
            createDatabaseError(
                'Import 횟수 조회 중 오류가 발생했습니다.',
                'countUserImportsInWindow',
                err
            )
        );
    }
}

/**
 * 시스템 전체 최근 N시간 내 Import 횟수 조회
 */
export async function countSystemImportsInWindow(hours: number): Promise<Result<number>> {
    try {
        const supabase = await createClient();
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('import_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since);

        if (error) {
            return failure(createDatabaseError(error.message, 'countSystemImportsInWindow', error));
        }

        return success(count ?? 0);
    } catch (err) {
        return failure(
            createDatabaseError(
                'Import 횟수 조회 중 오류가 발생했습니다.',
                'countSystemImportsInWindow',
                err
            )
        );
    }
}

// ============================================
// Import Log
// ============================================

export interface CreateImportLogInput {
    user_id: string;
    import_type?: string;
    ra_url: string;
    venue_id?: string;
    event_count: number;
    status?: string;
}

/**
 * Import 로그 기록
 */
export async function createImportLog(
    input: CreateImportLogInput
): Promise<Result<{ id: string }>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('import_logs')
            .insert({
                user_id: input.user_id,
                import_type: input.import_type ?? 'venue',
                ra_url: input.ra_url,
                venue_id: input.venue_id,
                event_count: input.event_count,
                status: input.status ?? 'completed',
            })
            .select('id')
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createImportLog', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('Import 로그 기록 중 오류가 발생했습니다.', 'createImportLog', err)
        );
    }
}
