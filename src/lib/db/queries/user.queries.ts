// lib/db/queries/user.queries.ts
// 서버 전용 - 순수 DB 쿼리
import { supabase } from '@/lib/supabase';
import type { DBUser, DBUserWithPages } from '@/types/database';

export async function findUserByUsername(username: string): Promise<DBUser | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }
    return data;
}

export async function findUserWithPages(username: string): Promise<DBUserWithPages | null> {
    const { data, error } = await supabase
        .from('users')
        .select(
            `
            *,
            pages (
                *,
                components (
                    id,
                    type,
                    position,
                    data,
                    created_at,
                    updated_at
                )
            )
        `
        )
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error fetching user with pages:', error);
        return null;
    }
    return data;
}
