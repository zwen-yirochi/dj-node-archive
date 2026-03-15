// lib/db/queries/user.queries.ts
// 서버 전용 - 순수 DB 쿼리
import type { User, UserWithPages } from '@/types/database';
import {
    createDatabaseError,
    createNotFoundError,
    failure,
    success,
    type Result,
} from '@/types/result';
import { createClient } from '@/lib/supabase/server';

export async function findUserByUsername(username: string): Promise<Result<User>> {
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

export async function findUserWithPages(username: string): Promise<Result<UserWithPages>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select(
                `
                *,
                pages (
                    *,
                    entries (
                        id,
                        type,
                        position,
                        reference_id,
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

export async function findUserById(userId: string): Promise<Result<User>> {
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

export async function findUserWithPagesById(userId: string): Promise<Result<UserWithPages>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select(
                `
                *,
                pages (
                    *,
                    entries (
                        id,
                        type,
                        position,
                        reference_id,
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

export async function findUserWithPagesByAuthId(
    authUserId: string
): Promise<Result<UserWithPages>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select(
                `
                *,
                pages (
                    *,
                    entries (
                        id,
                        type,
                        position,
                        reference_id,
                        data,
                        created_at,
                        updated_at
                    )
                )
            `
            )
            .eq('auth_user_id', authUserId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`사용자를 찾을 수 없습니다.`, 'user'));
            }
            return failure(createDatabaseError(error.message, 'findUserWithPagesByAuthId', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                '사용자 조회 중 오류가 발생했습니다.',
                'findUserWithPagesByAuthId',
                err
            )
        );
    }
}

export async function findUserByAuthId(authUserId: string): Promise<Result<User | null>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findUserByAuthId', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 조회 중 오류가 발생했습니다.', 'findUserByAuthId', err)
        );
    }
}

export async function createUser(userData: {
    auth_user_id: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
}): Promise<Result<User>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .insert({
                auth_user_id: userData.auth_user_id,
                email: userData.email,
                username: userData.username,
                display_name: userData.display_name,
                avatar_url: userData.avatar_url || '',
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createUser', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 생성 중 오류가 발생했습니다.', 'createUser', err)
        );
    }
}

export async function isUsernameTaken(
    username: string,
    excludeUserId?: string
): Promise<Result<boolean>> {
    try {
        const supabase = await createClient();
        let query = supabase.from('users').select('id').eq('username', username);
        if (excludeUserId) query = query.neq('id', excludeUserId);
        const { data, error } = await query.maybeSingle();
        if (error) return failure(createDatabaseError(error.message, 'isUsernameTaken', error));
        return success(!!data);
    } catch (err) {
        return failure(createDatabaseError('username 중복 확인 중 오류', 'isUsernameTaken', err));
    }
}

export async function updateUsername(userId: string, newUsername: string): Promise<Result<User>> {
    try {
        const supabase = await createClient();

        // 1. Update username
        const { data: user, error: userError } = await supabase
            .from('users')
            .update({ username: newUsername, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (userError) {
            if (userError.code === '23505') {
                return failure(
                    createDatabaseError('이미 사용 중인 username입니다.', 'updateUsername')
                );
            }
            return failure(createDatabaseError(userError.message, 'updateUsername', userError));
        }

        // 2. Sync page slug
        const { error: pageError } = await supabase
            .from('pages')
            .update({ slug: newUsername, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (pageError) {
            console.error('page slug 동기화 실패:', pageError);
        }

        return success(user);
    } catch (err) {
        return failure(createDatabaseError('username 업데이트 중 오류', 'updateUsername', err));
    }
}

export async function updateUser(
    userId: string,
    updates: {
        display_name?: string;
        bio?: string;
        avatar_url?: string;
        region?: string;
    }
): Promise<Result<User>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`사용자를 찾을 수 없습니다.`, 'user'));
            }
            return failure(createDatabaseError(error.message, 'updateUser', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('사용자 업데이트 중 오류가 발생했습니다.', 'updateUser', err)
        );
    }
}
