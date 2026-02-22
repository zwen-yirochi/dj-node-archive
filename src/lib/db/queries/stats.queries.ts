// lib/db/queries/stats.queries.ts
// 서버 전용 - 플랫폼 통계 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import { type Result, success, failure, createDatabaseError } from '@/types/result';

export interface PlatformStats {
    events: number;
    venues: number;
    artists: number;
}

/**
 * 플랫폼 전체 통계 (이벤트, 베뉴, 아티스트 수)
 */
export async function getPlatformStats(): Promise<Result<PlatformStats>> {
    try {
        const supabase = await createClient();

        const [eventsResult, venuesResult, artistsResult] = await Promise.all([
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('venues').select('*', { count: 'exact', head: true }),
            supabase.from('artists').select('*', { count: 'exact', head: true }),
        ]);

        if (eventsResult.error || venuesResult.error || artistsResult.error) {
            const errorMsg =
                eventsResult.error?.message ||
                venuesResult.error?.message ||
                artistsResult.error?.message ||
                'Unknown error';
            return failure(createDatabaseError(errorMsg));
        }

        return success({
            events: eventsResult.count ?? 0,
            venues: venuesResult.count ?? 0,
            artists: artistsResult.count ?? 0,
        });
    } catch (error) {
        return failure(createDatabaseError('Failed to fetch platform stats', undefined, error));
    }
}
