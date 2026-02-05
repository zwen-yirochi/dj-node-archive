// lib/db/queries/display-entry.queries.ts
// 서버 전용 - DisplayEntry (page_view_items) DB 쿼리
import { createClient } from '@/lib/supabase/server';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

// DB 타입 정의
export interface DBDisplayEntry {
    id: string;
    page_id: string;
    entry_id: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

// 페이지의 DisplayEntry 조회
export async function getDisplayEntriesByPageId(pageId: string): Promise<Result<DBDisplayEntry[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .select('*')
            .eq('page_id', pageId)
            .order('order_index', { ascending: true });

        if (error) {
            return failure(createDatabaseError(error.message, 'getDisplayEntriesByPageId', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                'DisplayEntry 조회 중 오류가 발생했습니다.',
                'getDisplayEntriesByPageId',
                err
            )
        );
    }
}

// DisplayEntry 추가
export async function addDisplayEntry(
    pageId: string,
    entryId: string,
    orderIndex: number
): Promise<Result<DBDisplayEntry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .insert({
                page_id: pageId,
                entry_id: entryId,
                order_index: orderIndex,
                is_visible: true,
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'addDisplayEntry', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('DisplayEntry 추가 중 오류가 발생했습니다.', 'addDisplayEntry', err)
        );
    }
}

// DisplayEntry 제거
export async function removeDisplayEntry(id: string): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('page_view_items').delete().eq('id', id);

        if (error) {
            return failure(createDatabaseError(error.message, 'removeDisplayEntry', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                'DisplayEntry 삭제 중 오류가 발생했습니다.',
                'removeDisplayEntry',
                err
            )
        );
    }
}

// DisplayEntry 순서 일괄 변경
export async function updateDisplayEntryOrder(
    updates: { id: string; orderIndex: number }[]
): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        const results = await Promise.all(
            updates.map(({ id, orderIndex }) =>
                supabase
                    .from('page_view_items')
                    .update({ order_index: orderIndex, updated_at: new Date().toISOString() })
                    .eq('id', id)
            )
        );

        const failedUpdate = results.find((r) => r.error);
        if (failedUpdate?.error) {
            return failure(
                createDatabaseError(
                    failedUpdate.error.message,
                    'updateDisplayEntryOrder',
                    failedUpdate.error
                )
            );
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                'DisplayEntry 순서 변경 중 오류가 발생했습니다.',
                'updateDisplayEntryOrder',
                err
            )
        );
    }
}

// DisplayEntry 표시 여부 토글
export async function toggleDisplayEntryVisibility(id: string): Promise<Result<DBDisplayEntry>> {
    try {
        const supabase = await createClient();

        // 현재 상태 조회
        const { data: current, error: selectError } = await supabase
            .from('page_view_items')
            .select('is_visible')
            .eq('id', id)
            .single();

        if (selectError) {
            if (selectError.code === 'PGRST116') {
                return failure(
                    createNotFoundError('DisplayEntry를 찾을 수 없습니다.', 'display_entry')
                );
            }
            return failure(
                createDatabaseError(
                    selectError.message,
                    'toggleDisplayEntryVisibility',
                    selectError
                )
            );
        }

        // 토글
        const { data, error } = await supabase
            .from('page_view_items')
            .update({
                is_visible: !current.is_visible,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return failure(
                createDatabaseError(error.message, 'toggleDisplayEntryVisibility', error)
            );
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                'DisplayEntry 표시 여부 변경 중 오류가 발생했습니다.',
                'toggleDisplayEntryVisibility',
                err
            )
        );
    }
}

// DisplayEntry 표시 여부 직접 설정
export async function setDisplayEntryVisibility(
    id: string,
    isVisible: boolean
): Promise<Result<DBDisplayEntry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .update({
                is_visible: isVisible,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(
                    createNotFoundError('DisplayEntry를 찾을 수 없습니다.', 'display_entry')
                );
            }
            return failure(createDatabaseError(error.message, 'setDisplayEntryVisibility', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                'DisplayEntry 표시 여부 설정 중 오류가 발생했습니다.',
                'setDisplayEntryVisibility',
                err
            )
        );
    }
}

// 특정 페이지의 최대 order_index 조회
export async function getMaxDisplayEntryOrderIndex(pageId: string): Promise<Result<number>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .select('order_index')
            .eq('page_id', pageId)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // DisplayEntry가 없는 경우
                return success(-1);
            }
            return failure(
                createDatabaseError(error.message, 'getMaxDisplayEntryOrderIndex', error)
            );
        }

        return success(data.order_index);
    } catch (err) {
        return failure(
            createDatabaseError(
                '최대 order_index 조회 중 오류가 발생했습니다.',
                'getMaxDisplayEntryOrderIndex',
                err
            )
        );
    }
}
