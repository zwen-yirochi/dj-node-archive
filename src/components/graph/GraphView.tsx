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

const STATUS_CLASS = 'font-mono-main text-dna-ui uppercase tracking-dna-system text-dna-ink-ghost';

function GraphViewInner({ centerId, centerType, className }: GraphViewProps) {
    const [currentCenterId, setCurrentCenterId] = useState(centerId);
    const { data, error } = useGraphExplore(currentCenterId);

    // Initial load only — no data at all yet
    if (!data) {
        return (
            <div className={`flex items-center justify-center bg-transparent ${className || ''}`}>
                <div className={STATUS_CLASS}>
                    {error ? '// err: graph load failed' : '// loading graph...'}
                </div>
            </div>
        );
    }

    if (data.nodes.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-transparent ${className || ''}`}>
                <div className={STATUS_CLASS}>// no connections</div>
            </div>
        );
    }

    // GraphCanvas stays mounted — data updates flow in as props
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
