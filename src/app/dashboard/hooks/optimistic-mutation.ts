// hooks/optimistic-mutation.ts
/**
 * 옵티미스틱 뮤테이션 팩토리 함수
 *
 * cancel → snapshot → optimistic update → rollback → invalidate
 * 보일러플레이트를 한 번만 작성.
 *
 * 캐시 대상: ContentEntry[] (순수 배열)
 * triggersPreview 옵션으로 미리보기 새로고침을 중앙 관리.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';

import type { ContentEntry } from '@/types';

import { entryKeys } from './use-editor-data';

export interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, entries: ContentEntry[] | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, entries: ContentEntry[]) => ContentEntry[];
    triggersPreview?: boolean | ((params: TParams, snapshot: ContentEntry[]) => boolean);
    onPreviewTrigger?: () => void;
}

/**
 * useMutation에 넘길 옵션 객체를 생성하는 팩토리 함수.
 *
 * - `snapshotRef`로 onMutate 실행 전 데이터를 캡처 → mutationFn에 전달
 * - TanStack Query 실행 순서: onMutate → mutationFn
 * - `triggersPreview`가 설정되면 onSuccess에서 미리보기 새로고침
 */
export function makeOptimisticMutation<TParams>(
    queryClient: QueryClient,
    snapshotRef: { current: ContentEntry[] | undefined },
    config: OptimisticMutationConfig<TParams>
): UseMutationOptions<unknown, Error, TParams, { previous?: ContentEntry[] }> {
    return {
        mutationFn: (params: TParams) => config.mutationFn(params, snapshotRef.current),
        onMutate: async (params: TParams) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData<ContentEntry[]>(entryKeys.all);
            snapshotRef.current = previous;
            if (previous) {
                queryClient.setQueryData<ContentEntry[]>(
                    entryKeys.all,
                    config.optimisticUpdate(params, previous)
                );
            }
            return { previous };
        },
        onSuccess: (_data, params) => {
            if (!config.triggersPreview || !config.onPreviewTrigger) return;
            const shouldRefresh =
                typeof config.triggersPreview === 'function'
                    ? config.triggersPreview(params, snapshotRef.current!)
                    : true;
            if (shouldRefresh) {
                config.onPreviewTrigger();
            }
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
