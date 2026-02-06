// lib/db/queries/entry.queries.ts
// 서버 전용 - Entry DB 쿼리
import { createClient } from '@/lib/supabase/server';
import type { Entry, EntryType, EntryData } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

export interface CreateEntryInput {
    page_id: string;
    type: EntryType;
    position: number;
    is_visible?: boolean;
    data: EntryData;
}

export interface UpdateEntryInput {
    type?: EntryType;
    is_visible?: boolean;
    data?: EntryData;
}

export async function createEntry(id: string, input: CreateEntryInput): Promise<Result<Entry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .insert({
                id,
                page_id: input.page_id,
                type: input.type,
                position: input.position,
                is_visible: input.is_visible ?? true,
                data: input.data,
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createEntry', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 생성 중 오류가 발생했습니다.', 'createEntry', err)
        );
    }
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Result<Entry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`엔트리를 찾을 수 없습니다.`, 'entry'));
            }
            return failure(createDatabaseError(error.message, 'updateEntry', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 수정 중 오류가 발생했습니다.', 'updateEntry', err)
        );
    }
}

export async function deleteEntry(id: string): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('entries').delete().eq('id', id);

        if (error) {
            return failure(createDatabaseError(error.message, 'deleteEntry', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 삭제 중 오류가 발생했습니다.', 'deleteEntry', err)
        );
    }
}

export async function updateEntryPositions(
    updates: { id: string; position: number }[]
): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        // 트랜잭션으로 처리하기 위해 Promise.all 사용
        const results = await Promise.all(
            updates.map(({ id, position }) =>
                supabase
                    .from('entries')
                    .update({ position, updated_at: new Date().toISOString() })
                    .eq('id', id)
            )
        );

        const failedUpdate = results.find((r) => r.error);
        if (failedUpdate?.error) {
            return failure(
                createDatabaseError(
                    failedUpdate.error.message,
                    'updateEntryPositions',
                    failedUpdate.error
                )
            );
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                '엔트리 순서 변경 중 오류가 발생했습니다.',
                'updateEntryPositions',
                err
            )
        );
    }
}

export async function getMaxPosition(pageId: string): Promise<Result<number>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select('position')
            .eq('page_id', pageId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 엔트리가 없는 경우
                return success(-1);
            }
            return failure(createDatabaseError(error.message, 'getMaxPosition', error));
        }

        return success(data.position);
    } catch (err) {
        return failure(
            createDatabaseError('최대 position 조회 중 오류가 발생했습니다.', 'getMaxPosition', err)
        );
    }
}
