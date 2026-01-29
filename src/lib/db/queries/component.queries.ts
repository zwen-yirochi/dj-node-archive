// lib/db/queries/component.queries.ts
// 서버 전용 - 컴포넌트 DB 쿼리
import { supabase } from '@/lib/supabase';
import type { DBComponent, DBComponentType, ComponentDataType } from '@/types/database';
import {
    type Result,
    success,
    failure,
    createDatabaseError,
    createNotFoundError,
} from '@/types/result';

export interface CreateComponentInput {
    page_id: string;
    type: DBComponentType;
    position: number;
    data: ComponentDataType;
}

export interface UpdateComponentInput {
    type?: DBComponentType;
    data?: ComponentDataType;
}

export async function createComponent(
    id: string,
    input: CreateComponentInput
): Promise<Result<DBComponent>> {
    try {
        const { data, error } = await supabase
            .from('components')
            .insert({
                id,
                page_id: input.page_id,
                type: input.type,
                position: input.position,
                data: input.data,
            })
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'createComponent', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('컴포넌트 생성 중 오류가 발생했습니다.', 'createComponent', err)
        );
    }
}

export async function updateComponent(
    id: string,
    input: UpdateComponentInput
): Promise<Result<DBComponent>> {
    try {
        const { data, error } = await supabase
            .from('components')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError(`컴포넌트를 찾을 수 없습니다.`, 'component'));
            }
            return failure(createDatabaseError(error.message, 'updateComponent', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('컴포넌트 수정 중 오류가 발생했습니다.', 'updateComponent', err)
        );
    }
}

export async function deleteComponent(id: string): Promise<Result<void>> {
    try {
        const { error } = await supabase.from('components').delete().eq('id', id);

        if (error) {
            return failure(createDatabaseError(error.message, 'deleteComponent', error));
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError('컴포넌트 삭제 중 오류가 발생했습니다.', 'deleteComponent', err)
        );
    }
}

export async function updateComponentPositions(
    updates: { id: string; position: number }[]
): Promise<Result<void>> {
    try {
        // 트랜잭션으로 처리하기 위해 Promise.all 사용
        const results = await Promise.all(
            updates.map(({ id, position }) =>
                supabase
                    .from('components')
                    .update({ position, updated_at: new Date().toISOString() })
                    .eq('id', id)
            )
        );

        const failedUpdate = results.find((r) => r.error);
        if (failedUpdate?.error) {
            return failure(
                createDatabaseError(
                    failedUpdate.error.message,
                    'updateComponentPositions',
                    failedUpdate.error
                )
            );
        }

        return success(undefined);
    } catch (err) {
        return failure(
            createDatabaseError(
                '컴포넌트 순서 변경 중 오류가 발생했습니다.',
                'updateComponentPositions',
                err
            )
        );
    }
}

export async function getMaxPosition(pageId: string): Promise<Result<number>> {
    try {
        const { data, error } = await supabase
            .from('components')
            .select('position')
            .eq('page_id', pageId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 컴포넌트가 없는 경우
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
