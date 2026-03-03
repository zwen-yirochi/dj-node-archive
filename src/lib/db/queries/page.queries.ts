// lib/db/queries/page.queries.ts
// 서버 전용 - 순수 DB 쿼리
import type { Page } from '@/types/database';
import { createDatabaseError, failure, success, type Result } from '@/types/result';
import { createClient } from '@/lib/supabase/server';

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

export interface UpdatePageInput {
    theme?: string;
    is_public?: boolean;
    header_style?: string;
}

export async function updatePage(pageId: string, input: UpdatePageInput): Promise<Result<Page>> {
    try {
        const supabase = await createClient();
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (input.theme !== undefined) updateData.theme = input.theme;
        if (input.is_public !== undefined) updateData.is_public = input.is_public;
        if (input.header_style !== undefined) updateData.header_style = input.header_style;

        const { data, error } = await supabase
            .from('pages')
            .update(updateData)
            .eq('id', pageId)
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'updatePage', error));
        }
        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('페이지 업데이트 중 오류가 발생했습니다.', 'updatePage', err)
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
