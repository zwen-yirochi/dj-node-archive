// hooks/optimistic-mutation.ts
/**
 * Optimistic mutation factory function
 *
 * cancel -> snapshot -> optimistic update -> rollback -> invalidate
 * Write the boilerplate once.
 *
 * Cache target: ContentEntry[] (plain array)
 * Centrally manages preview refresh via the triggersPreview option.
 */

import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';

import type { ContentEntry } from '@/types';

import { entryKeys } from './use-editor-data';
import type { PreviewTarget } from './use-preview-actions';

export interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, entries: ContentEntry[] | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, entries: ContentEntry[]) => ContentEntry[];
    triggersPreview?: boolean | ((params: TParams, snapshot: ContentEntry[]) => boolean);
    previewTarget?: PreviewTarget;
    onPreviewTrigger?: (target: PreviewTarget) => void;
}

/**
 * Factory function that creates an options object for useMutation.
 *
 * - Captures data before onMutate via `snapshotRef` and passes it to mutationFn
 * - TanStack Query execution order: onMutate -> mutationFn
 * - When `triggersPreview` is set, refreshes the preview on onSuccess
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
                const updated = config.optimisticUpdate(params, previous);
                queryClient.setQueryData<ContentEntry[]>(entryKeys.all, updated);

                // detail 캐시도 동기화
                for (const entry of updated) {
                    const detailKey = entryKeys.detail(entry.id);
                    if (queryClient.getQueryData(detailKey)) {
                        queryClient.setQueryData(detailKey, entry);
                    }
                }
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
                config.onPreviewTrigger(config.previewTarget ?? 'userpage');
            }
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(entryKeys.all, ctx.previous);

                // detail 캐시도 롤백
                for (const entry of ctx.previous) {
                    const detailKey = entryKeys.detail(entry.id);
                    if (queryClient.getQueryData(detailKey)) {
                        queryClient.setQueryData(detailKey, entry);
                    }
                }
            }
        },
        onSettled: () => {
            snapshotRef.current = undefined;
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    };
}
