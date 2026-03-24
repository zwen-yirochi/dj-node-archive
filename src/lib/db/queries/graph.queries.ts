// lib/db/queries/graph.queries.ts
// Graph data queries using Supabase RPC
import type { LocalGraphData } from '@/types/graph';
import { createDatabaseError, failure, success, type Result } from '@/types/result';
import { createClient } from '@/lib/supabase/server';

export async function getLocalGraph(
    centerId: string,
    maxDepth: number = 2
): Promise<Result<LocalGraphData>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_local_graph', {
            center_id: centerId,
            max_depth: maxDepth,
        });

        if (error) {
            return failure(createDatabaseError(error.message, 'getLocalGraph', error));
        }

        return success(data as LocalGraphData);
    } catch (err) {
        return failure(
            createDatabaseError('그래프 데이터 조회 중 오류가 발생했습니다.', 'getLocalGraph', err)
        );
    }
}
