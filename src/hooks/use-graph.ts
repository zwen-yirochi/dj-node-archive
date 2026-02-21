// hooks/use-graph.ts
// TanStack Query hooks for graph data fetching
import { useQuery } from '@tanstack/react-query';
import type { LocalGraphData } from '@/types/graph';

export const graphKeys = {
    all: ['graph'] as const,
    explore: (nodeId: string, depth: number) => ['graph', 'explore', nodeId, depth] as const,
};

async function fetchGraphExplore(nodeId: string, depth: number): Promise<LocalGraphData> {
    const res = await fetch(`/api/graph/explore?nodeId=${nodeId}&depth=${depth}`);
    if (!res.ok) throw new Error('Failed to fetch graph data');
    const json = await res.json();
    return json.data;
}

export function useGraphExplore(nodeId: string | null, depth: number = 2) {
    return useQuery({
        queryKey: graphKeys.explore(nodeId!, depth),
        queryFn: () => fetchGraphExplore(nodeId!, depth),
        enabled: !!nodeId,
        staleTime: 60 * 1000,
    });
}
