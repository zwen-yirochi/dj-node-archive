// lib/db/queries/page.queries.ts
// 서버 전용 - 순수 DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { Page } from '@/types/database';
import { type Result, success, failure, createDatabaseError } from '@/types/result';

export async function createDefaultPage(userId: string, slug: string): Promise<Result<Page>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('pages')
            .insert({
                user_id: userId,
                slug: slug,
                title: null,
                bio: null,
                avatar_url: null,
                theme_color: '#000000',
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createDefaultPage', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('페이지 생성 중 오류가 발생했습니다.', 'createDefaultPage', err)
        );
    }
}

export async function findPageByUserId(userId: string): Promise<Result<Page | null>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            return failure(createDatabaseError(error.message, 'findPageByUserId', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('페이지 조회 중 오류가 발생했습니다.', 'findPageByUserId', err)
        );
    }
}
