// lib/db/queries/entry.queries.ts
// 서버 전용 - Entry DB 쿼리
import type { Entry, EntryData, EntryType } from '@/types/database';
import {
    createDatabaseError,
    createNotFoundError,
    failure,
    success,
    type Result,
} from '@/types/result';
import { createClient } from '@/lib/supabase/server';

export interface CreateEntryInput {
    page_id: string;
    type: EntryType;
    position: number;
    reference_id?: string | null; // events.id 또는 mixsets.id 참조
    data: EntryData;
}

export interface UpdateEntryInput {
    type?: EntryType;
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
                reference_id: input.reference_id ?? null,
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

        // Explicitly build update object to ensure null values are included
        const updateObj: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.type !== undefined) updateObj.type = input.type;
        if (input.data !== undefined) updateObj.data = input.data;

        const { data, error } = await supabase
            .from('entries')
            .update(updateObj)
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

export async function getEntryById(id: string): Promise<Result<Entry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('entries').select().eq('id', id).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('엔트리를 찾을 수 없습니다.', 'entry'));
            }
            return failure(createDatabaseError(error.message, 'getEntryById', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 조회 중 오류가 발생했습니다.', 'getEntryById', err)
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
        // 개별 update를 병렬 실행 (트랜잭션 아님 — partial failure 가능)
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

export async function getEntriesByPageId(pageId: string): Promise<Result<Entry[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('entries').select('id').eq('page_id', pageId);

        if (error) {
            return failure(createDatabaseError(error.message, 'getEntriesByPageId', error));
        }
        return success((data ?? []) as Entry[]);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 조회 중 오류가 발생했습니다.', 'getEntriesByPageId', err)
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

export async function getEntryBySlug(pageId: string, slug: string): Promise<Result<Entry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select()
            .eq('page_id', pageId)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('엔트리를 찾을 수 없습니다.', 'entry'));
            }
            return failure(createDatabaseError(error.message, 'getEntryBySlug', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 조회 중 오류가 발생했습니다.', 'getEntryBySlug', err)
        );
    }
}
