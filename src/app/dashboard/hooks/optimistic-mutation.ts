// hooks/optimistic-mutation.ts
/**
 * 옵티미스틱 뮤테이션 팩토리 함수
 *
 * cancel → snapshot → optimistic update → rollback → invalidate
 * 보일러플레이트를 한 번만 작성.
 */

import type { EditorData } from '@/lib/services/user.service';
import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import { entryKeys } from './use-editor-data';

export interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, data: EditorData | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, data: EditorData) => EditorData;
}

/**
 * useMutation에 넘길 옵션 객체를 생성하는 팩토리 함수.
 *
 * - `snapshotRef`로 onMutate 실행 전 데이터를 캡처 → mutationFn에 전달
 * - TanStack Query 실행 순서: onMutate → mutationFn
 */
export function makeOptimisticMutation<TParams>(
    queryClient: QueryClient,
    snapshotRef: { current: EditorData | undefined },
    config: OptimisticMutationConfig<TParams>
): UseMutationOptions<unknown, Error, TParams, { previous?: EditorData }> {
    return {
        mutationFn: (params: TParams) => config.mutationFn(params, snapshotRef.current),
        onMutate: async (params: TParams) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<EditorData>(entryKeys.all);
            snapshotRef.current = previous;
            if (previous) {
                queryClient.setQueryData<EditorData>(
                    entryKeys.all,
                    config.optimisticUpdate(params, previous)
                );
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(entryKeys.all, ctx.previous);
            }
        },
        onSettled: () => {
            snapshotRef.current = undefined;
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    };
}
