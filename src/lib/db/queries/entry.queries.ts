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
    reference_id?: string | null; // events.id 또는 mixsets.id 참조
    data: EntryData;
}

export interface UpdateEntryInput {
    type?: EntryType;
    is_visible?: boolean;
    display_order?: number | null;
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
        if (input.is_visible !== undefined) updateObj.is_visible = input.is_visible;
        if (input.data !== undefined) updateObj.data = input.data;
        // Explicitly handle display_order (including null)
        if ('display_order' in input) updateObj.display_order = input.display_order;

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

/**
 * Page에 표시된 엔트리들의 최대 display_order 조회
 */
export async function getMaxDisplayOrder(pageId: string): Promise<Result<number>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select('display_order')
            .eq('page_id', pageId)
            .not('display_order', 'is', null)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Page에 표시된 엔트리가 없는 경우
                return success(-1);
            }
            return failure(createDatabaseError(error.message, 'getMaxDisplayOrder', error));
        }

        return success(data.display_order);
    } catch (err) {
        return failure(
            createDatabaseError(
                '최대 display_order 조회 중 오류가 발생했습니다.',
                'getMaxDisplayOrder',
                err
            )
        );
    }
}

/**
 * Page 내 엔트리 순서 변경 (display_order 업데이트)
 */
export async function updateDisplayOrders(
    updates: { id: string; display_order: number | null }[]
): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        const results = await Promise.all(
            updates.map(({ id, display_order }) =>
                supabase
                    .from('entries')
                    .update({ display_order, updated_at: new Date().toISOString() })
                    .eq('id', id)
            )
        );

        const failedUpdate = results.find((r) => r.error);
        if (failedUpdate?.error) {
            return failure(
                createDatabaseError(
                    failedUpdate.error.message,
                    'updateDisplayOrders',
                    failedUpdate.error
                )
            );
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                'display_order 변경 중 오류가 발생했습니다.',
                'updateDisplayOrders',
                err
            )
        );
    }
}
