// lib/db/queries/user.queries.ts
// 서버 전용 - 순수 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { DBUser, DBUserWithPages } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

export async function findUserByUsername(username: string): Promise<Result<DBUser>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError(`사용자 '${username}'을 찾을 수 없습니다.`, 'user')
                );
            }
            return failure(createDatabaseError(error.message, 'findUserByUsername', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 조회 중 오류가 발생했습니다.', 'findUserByUsername', err)
        );
    }
}

export async function findUserWithPages(username: string): Promise<Result<DBUserWithPages>> {
    try {
        const supabase = await createClient();
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
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError(`사용자 '${username}'을 찾을 수 없습니다.`, 'user')
                );
            }
            return failure(createDatabaseError(error.message, 'findUserWithPages', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 조회 중 오류가 발생했습니다.', 'findUserWithPages', err)
        );
    }
}

export async function findUserById(userId: string): Promise<Result<DBUser>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`사용자를 찾을 수 없습니다.`, 'user'));
            }
            return failure(createDatabaseError(error.message, 'findUserById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 조회 중 오류가 발생했습니다.', 'findUserById', err)
        );
    }
}

export async function findUserWithPagesById(userId: string): Promise<Result<DBUserWithPages>> {
    try {
        const supabase = await createClient();
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
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`사용자를 찾을 수 없습니다.`, 'user'));
            }
            return failure(createDatabaseError(error.message, 'findUserWithPagesById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 조회 중 오류가 발생했습니다.', 'findUserWithPagesById', err)
        );
    }
}
