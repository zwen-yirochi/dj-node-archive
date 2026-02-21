'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGraphExplore } from '@/hooks/use-graph';
import type { NodeType } from '@/types/graph';

const GraphCanvas = dynamic(() => import('./GraphCanvas'), { ssr: false });

interface GraphViewProps {
    centerId: string;
    centerType: NodeType;
    className?: string;
}

function GraphViewInner({ centerId, centerType, className }: GraphViewProps) {
    const [currentCenterId, setCurrentCenterId] = useState(centerId);
    const { data, isLoading, error } = useGraphExplore(currentCenterId);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-[#0a0a0a] ${className || ''}`}>
                <div className="text-sm text-zinc-500">Loading graph...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={`flex items-center justify-center bg-[#0a0a0a] ${className || ''}`}>
                <div className="text-sm text-zinc-500">Failed to load graph</div>
            </div>
        );
    }

    if (data.nodes.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-[#0a0a0a] ${className || ''}`}>
                <div className="text-sm text-zinc-500">No connections found</div>
            </div>
        );
    }

    return (
        <div className={className}>
            <GraphCanvas data={data} centerId={currentCenterId} onRecenter={setCurrentCenterId} />
        </div>
    );
}

export default function GraphView({ centerId, centerType, className }: GraphViewProps) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        gcTime: 5 * 60 * 1000,
                    },
                },
            }),
        []
    );

    return (
        <QueryClientProvider client={queryClient}>
            <GraphViewInner centerId={centerId} centerType={centerType} className={className} />
        </QueryClientProvider>
    );
}
