// lib/db/queries/artist.queries.ts
import { createClient } from '@/lib/supabase/server';
import type { DBArtistReference } from '@/types/database';

export type CreateArtistInput = {
    name: string;
    instagram?: string;
    ra_url?: string;
};

export type ArtistResult =
    | { success: true; data: DBArtistReference }
    | { success: false; error: string };

export type ArtistsResult =
    | { success: true; data: DBArtistReference[] }
    | { success: false; error: string };

/**
 * 아티스트 검색 (이름 기준)
 */
export async function searchArtists(query: string, limit = 10): Promise<ArtistsResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('artist_references')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(limit);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as DBArtistReference[] };
}

/**
 * 새 아티스트 레퍼런스 생성
 */
export async function createArtist(
    input: CreateArtistInput,
    createdBy: string
): Promise<ArtistResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('artist_references')
        .insert({
            name: input.name,
            instagram: input.instagram,
            ra_url: input.ra_url,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as DBArtistReference };
}

/**
 * 아티스트 ID로 조회
 */
export async function findArtistById(id: string): Promise<ArtistResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('artist_references')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: data as DBArtistReference };
}

/**
 * 플랫폼 유저 검색 (users 테이블)
 */
export async function searchPlatformUsers(
    query: string,
    limit = 10
): Promise<
    | {
          success: true;
          data: Array<{ id: string; username: string; display_name?: string; avatar_url?: string }>;
      }
    | { success: false; error: string }
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('username')
        .limit(limit);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
