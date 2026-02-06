// lib/db/queries/artist.queries.ts
// 서버 전용 - 아티스트 관련 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { Artist } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
    createConflictError,
} from '@/types/result';

export interface CreateArtistInput {
    name: string;
    slug: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    claimed_by?: string;
}

/**
 * 아티스트 검색 (이름 기준)
 */
export async function searchArtists(query: string, limit = 10): Promise<Result<Artist[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('artists')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchArtists', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('아티스트 검색 중 오류가 발생했습니다.', 'searchArtists', err)
        );
    }
}

/**
 * 새 아티스트 생성
 */
export async function createArtist(input: CreateArtistInput): Promise<Result<Artist>> {
    try {
        const supabase = await createClient();

        // slug 중복 체크
        const { data: existing } = await supabase
            .from('artists')
            .select('id')
            .eq('slug', input.slug)
            .single();

        if (existing) {
            return failure(createConflictError('이미 존재하는 아티스트 slug입니다.', 'artist'));
        }

        const { data, error } = await supabase.from('artists').insert(input).select().single();

        if (error) {
            if (error.code === '23505') {
                return failure(createConflictError('이미 존재하는 아티스트입니다.', 'artist'));
            }
            return failure(createDatabaseError(error.message, 'createArtist', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('아티스트 생성 중 오류가 발생했습니다.', 'createArtist', err)
        );
    }
}

/**
 * 아티스트 ID로 조회
 */
export async function findArtistById(id: string): Promise<Result<Artist>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.from('artists').select('*').eq('id', id).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('아티스트를 찾을 수 없습니다.', 'artist'));
            }
            return failure(createDatabaseError(error.message, 'findArtistById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('아티스트 조회 중 오류가 발생했습니다.', 'findArtistById', err)
        );
    }
}

/**
 * 아티스트 slug로 조회
 */
export async function findArtistBySlug(slug: string): Promise<Result<Artist>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('artists')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError(`아티스트 '${slug}'를 찾을 수 없습니다.`, 'artist')
                );
            }
            return failure(createDatabaseError(error.message, 'findArtistBySlug', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('아티스트 조회 중 오류가 발생했습니다.', 'findArtistBySlug', err)
        );
    }
}

/**
 * 플랫폼 유저 검색 (users 테이블)
 */
export async function searchPlatformUsers(
    query: string,
    limit = 10
): Promise<
    Result<Array<{ id: string; username: string; display_name?: string; avatar_url?: string }>>
> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('users')
            .select('id, username, display_name, avatar_url')
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .order('username')
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'searchPlatformUsers', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('유저 검색 중 오류가 발생했습니다.', 'searchPlatformUsers', err)
        );
    }
}

/**
 * 모든 아티스트 조회 (관리용)
 */
export async function getAllArtists(limit: number = 100): Promise<Result<Artist[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('artists')
            .select('*')
            .order('name')
            .limit(limit);

        if (error) {
            return failure(createDatabaseError(error.message, 'getAllArtists', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError('아티스트 목록 조회 중 오류가 발생했습니다.', 'getAllArtists', err)
        );
    }
}

// Legacy alias
export type DBArtistReference = Artist;
