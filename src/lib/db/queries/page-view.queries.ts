// lib/db/queries/page-view.queries.ts
// 서버 전용 - page_view_items DB 쿼리
import { createClient } from '@/lib/supabase/server';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

// DB 타입 정의
export interface DBPageViewItem {
    id: string;
    page_id: string;
    component_id: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

// 페이지의 view items 조회
export async function getViewItemsByPageId(pageId: string): Promise<Result<DBPageViewItem[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .select('*')
            .eq('page_id', pageId)
            .order('order_index', { ascending: true });

        if (error) {
            return failure(createDatabaseError(error.message, 'getViewItemsByPageId', error));
        }

        return success(data || []);
    } catch (err) {
        return failure(
            createDatabaseError(
                'View items 조회 중 오류가 발생했습니다.',
                'getViewItemsByPageId',
                err
            )
        );
    }
}

// View에 컴포넌트 추가
export async function addViewItem(
    pageId: string,
    componentId: string,
    orderIndex: number
): Promise<Result<DBPageViewItem>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('page_view_items')
            .insert({
                page_id: pageId,
                component_id: componentId,
                order_index: orderIndex,
                is_visible: true,
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'addViewItem', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('View item 추가 중 오류가 발생했습니다.', 'addViewItem', err)
        );
    }
}

// View에서 제거
export async function removeViewItem(id: string): Promise<Result<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('page_view_items').delete().eq('id', id);

        if (error) {
            return failure(createDatabaseError(error.message, 'removeViewItem', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError('View item 삭제 중 오류가 발생했습니다.', 'removeViewItem', err)
        );
    }
}

// View items 순서 일괄 변경
export async function updateViewItemOrder(
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
                    'updateViewItemOrder',
                    failedUpdate.error
                )
            );
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                'View item 순서 변경 중 오류가 발생했습니다.',
                'updateViewItemOrder',
                err
            )
        );
    }
}

// View item 표시 여부 변경
export async function toggleViewItemVisibility(id: string): Promise<Result<DBPageViewItem>> {
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
                    createNotFoundError('View item을 찾을 수 없습니다.', 'page_view_item')
                );
            }
            return failure(
                createDatabaseError(selectError.message, 'toggleViewItemVisibility', selectError)
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
            return failure(createDatabaseError(error.message, 'toggleViewItemVisibility', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                'View item 표시 여부 변경 중 오류가 발생했습니다.',
                'toggleViewItemVisibility',
                err
            )
        );
    }
}

// View item 표시 여부 직접 설정
export async function setViewItemVisibility(
    id: string,
    isVisible: boolean
): Promise<Result<DBPageViewItem>> {
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
                    createNotFoundError('View item을 찾을 수 없습니다.', 'page_view_item')
                );
            }
            return failure(createDatabaseError(error.message, 'setViewItemVisibility', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError(
                'View item 표시 여부 설정 중 오류가 발생했습니다.',
                'setViewItemVisibility',
                err
            )
        );
    }
}

// 특정 페이지의 최대 order_index 조회
export async function getMaxViewItemOrderIndex(pageId: string): Promise<Result<number>> {
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
                // view items가 없는 경우
                return success(-1);
            }
            return failure(createDatabaseError(error.message, 'getMaxViewItemOrderIndex', error));
        }

        return success(data.order_index);
    } catch (err) {
        return failure(
            createDatabaseError(
                '최대 order_index 조회 중 오류가 발생했습니다.',
                'getMaxViewItemOrderIndex',
                err
            )
        );
    }
}
