// lib/db/queries/import.queries.ts
// 서버 전용 - Import 관련 DB 쿼리

import type { Entry, Event, Venue } from '@/types/database';
import {
    createConflictError,
    createDatabaseError,
    failure,
    success,
    type Result,
} from '@/types/result';
import type { CreateImportedEventInput, CreateImportedVenueInput } from '@/lib/mappers';
import { createClient } from '@/lib/supabase/server';

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
    metadata?: Record<string, unknown>;
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
                metadata: input.metadata ?? null,
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

/**
 * 유저의 아티스트 마이그레이션 완료 여부 조회
 */
export async function findArtistMigration(userId: string): Promise<
    Result<{
        status: string;
        metadata: Record<string, unknown>;
        event_count: number;
        created_at: string;
    } | null>
> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('import_logs')
            .select('status, metadata, created_at, event_count')
            .eq('user_id', userId)
            .eq('import_type', 'artist')
            .in('status', ['completed', 'partial'])
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findArtistMigration', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                '마이그레이션 조회 중 오류가 발생했습니다.',
                'findArtistMigration',
                err
            )
        );
    }
}

/**
 * 유저별 최근 N시간 내 단일 이벤트 Import 횟수 조회
 */
export async function countUserEventImportsInWindow(
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
            .eq('import_type', 'event')
            .gte('created_at', since);

        if (error) {
            return failure(
                createDatabaseError(error.message, 'countUserEventImportsInWindow', error)
            );
        }

        return success(count ?? 0);
    } catch (err) {
        return failure(
            createDatabaseError(
                'Import 횟수 조회 중 오류가 발생했습니다.',
                'countUserEventImportsInWindow',
                err
            )
        );
    }
}

/**
 * Import된 이벤트를 entries 테이블에 배치 생성 (reference 타입)
 */
export async function createImportedEntries(
    entries: {
        id: string;
        page_id: string;
        type: 'event';
        position: number;
        reference_id: string;
        data: Record<string, unknown>;
        slug: string;
    }[]
): Promise<Result<Entry[]>> {
    if (entries.length === 0) return success([]);

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('entries').insert(entries).select();

        if (error) {
            return failure(createDatabaseError(error.message, 'createImportedEntries', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                '엔트리 배치 생성 중 오류가 발생했습니다.',
                'createImportedEntries',
                err
            )
        );
    }
}

/**
 * RA event ID 배열로 기존 이벤트 일괄 조회 (N+1 방지)
 */
export async function findEventsByRAIds(raEventIds: string[]): Promise<Result<Event[]>> {
    if (raEventIds.length === 0) return success([]);
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .in('data->>ra_event_id', raEventIds)
            .eq('source', 'ra_import');

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventsByRAIds', error));
        }
        return success(data || []);
    } catch (err) {
        return failure(createDatabaseError('이벤트 일괄 조회 오류', 'findEventsByRAIds', err));
    }
}

/**
 * 페이지의 entries에서 event_id 배열에 해당하는 reference entry 일괄 조회 (N+1 방지)
 */
export async function findEntriesByEventReferences(
    pageId: string,
    eventIds: string[]
): Promise<Result<Entry[]>> {
    if (eventIds.length === 0) return success([]);
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('page_id', pageId)
            .eq('type', 'event')
            .in('reference_id', eventIds);

        if (error) {
            return failure(
                createDatabaseError(error.message, 'findEntriesByEventReferences', error)
            );
        }
        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 일괄 조회 오류', 'findEntriesByEventReferences', err)
        );
    }
}

/**
 * RA event ID로 기존 이벤트 조회 (중복 체크)
 */
export async function findEventByRAId(raEventId: string): Promise<Result<Event | null>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('data->>ra_event_id', raEventId)
            .eq('source', 'ra_import')
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findEventByRAId', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('이벤트 조회 중 오류가 발생했습니다.', 'findEventByRAId', err)
        );
    }
}

/**
 * 유저의 entries에서 특정 event_id를 참조하는 entry가 있는지 확인
 */
export async function findEntryByEventReference(
    pageId: string,
    eventId: string
): Promise<Result<Entry | null>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('page_id', pageId)
            .eq('type', 'event')
            .eq('reference_id', eventId)
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findEntryByEventReference', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                '엔트리 조회 중 오류가 발생했습니다.',
                'findEntryByEventReference',
                err
            )
        );
    }
}
