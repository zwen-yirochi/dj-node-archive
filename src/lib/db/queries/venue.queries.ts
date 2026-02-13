// lib/db/queries/venue.queries.ts
// 서버 전용 - 베뉴 관련 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { Venue } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
    createConflictError,
} from '@/types/result';

export type VenueSearchResult = Venue & { event_count: number };

/**
 * 베뉴 검색 (자동완성용)
 * - name, city에 대해 ILIKE 검색
 * - 이벤트 수 기준 정렬
 */
export async function searchVenues(
    query: string,
    limit: number = 10
): Promise<Result<VenueSearchResult[]>> {
    try {
        const supabase = await createClient();
        const searchPattern = `%${query}%`;

        // 서브쿼리를 사용하여 이벤트 수와 함께 조회
        const { data, error } = await supabase.rpc('search_venues_with_event_count', {
            search_query: searchPattern,
            result_limit: limit,
        });

        if (error) {
            return failure(createDatabaseError(error.message, 'searchVenues', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 검색 중 오류가 발생했습니다.', 'searchVenues', err)
        );
    }
}

/**
 * 베뉴 검색 - 기본 쿼리 (RPC 함수 없이)
 */
export async function searchVenuesBasic(
    query: string,
    limit: number = 10
): Promise<Result<Venue[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
            .order('name')
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchVenuesBasic', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 검색 중 오류가 발생했습니다.', 'searchVenuesBasic', err)
        );
    }
}

/**
 * 베뉴 ID로 조회
 */
export async function findVenueById(venueId: string): Promise<Result<Venue>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('id', venueId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('베뉴를 찾을 수 없습니다.', 'venue'));
            }
            return failure(createDatabaseError(error.message, 'findVenueById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 조회 중 오류가 발생했습니다.', 'findVenueById', err)
        );
    }
}

/**
 * 베뉴 slug로 조회
 */
export async function findVenueBySlug(slug: string): Promise<Result<Venue>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('venues').select('*').eq('slug', slug).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`베뉴 '${slug}'을 찾을 수 없습니다.`, 'venue'));
            }
            return failure(createDatabaseError(error.message, 'findVenueBySlug', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 조회 중 오류가 발생했습니다.', 'findVenueBySlug', err)
        );
    }
}

export interface CreateVenueInput {
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    instagram?: string;
    website?: string;
    google_maps_url?: string;
    claimed_by?: string;
    source?: string;
    external_sources?: Record<string, string>;
}

/**
 * 새 베뉴 생성
 */
export async function createVenue(input: CreateVenueInput): Promise<Result<Venue>> {
    try {
        const supabase = await createClient();

        // slug 중복 체크
        const { data: existing } = await supabase
            .from('venues')
            .select('id')
            .eq('slug', input.slug)
            .single();

        if (existing) {
            return failure(createConflictError('이미 존재하는 베뉴 slug입니다.', 'venue'));
        }

        const { data, error } = await supabase.from('venues').insert(input).select().single();

        if (error) {
            if (error.code === '23505') {
                return failure(createConflictError('이미 존재하는 베뉴입니다.', 'venue'));
            }
            return failure(createDatabaseError(error.message, 'createVenue', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 생성 중 오류가 발생했습니다.', 'createVenue', err)
        );
    }
}

/**
 * 모든 베뉴 조회 (관리용)
 */
export async function getAllVenues(limit: number = 100): Promise<Result<Venue[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .order('name')
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'getAllVenues', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('베뉴 목록 조회 중 오류가 발생했습니다.', 'getAllVenues', err)
        );
    }
}

// Legacy alias
export type DBVenueReference = Venue;
export type DBVenueSearchResult = VenueSearchResult;
