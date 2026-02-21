'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { LocalGraphData, NodeType } from '@/types/graph';
import { NODE_COLORS } from '@/types/graph';

interface GraphCanvasProps {
    data: LocalGraphData;
    centerId: string;
    onRecenter: (nodeId: string) => void;
}

function buildGraph(data: LocalGraphData, centerId: string): Graph {
    const graph = new Graph();

    for (const node of data.nodes) {
        const degree = data.edges.filter(
            (e) => e.source_id === node.id || e.target_id === node.id
        ).length;
        const size = Math.max(3, Math.log2(degree + 1) * 4);
        const color = NODE_COLORS[node.type as NodeType] || NODE_COLORS.entry;

        graph.addNode(node.id, {
            label: node.label,
            size,
            color,
            x: Math.random() * 100,
            y: Math.random() * 100,
            type: node.id === centerId ? 'bordered' : 'circle',
            borderColor: '#ffffff',
            borderSize: node.id === centerId ? 2 : 0,
        });
    }

    for (const edge of data.edges) {
        if (!graph.hasNode(edge.source_id) || !graph.hasNode(edge.target_id)) continue;
        if (graph.hasEdge(edge.source_id, edge.target_id)) continue;

        graph.addEdge(edge.source_id, edge.target_id, {
            size: Math.max(0.5, edge.weight / 5),
            color: `rgba(150, 150, 150, ${0.05 + (edge.weight / 10) * 0.3})`,
            context: edge.context,
        });
    }

    return graph;
}

export default function GraphCanvas({ data, centerId, onRecenter }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const handleDoubleClick = useCallback(
        (nodeId: string) => {
            if (nodeId !== centerId) {
                onRecenter(nodeId);
            }
        },
        [centerId, onRecenter]
    );

    // Build and render graph
    useEffect(() => {
        if (!containerRef.current || data.nodes.length === 0) return;

        // Clean up previous instance
        if (sigmaRef.current) {
            sigmaRef.current.kill();
            sigmaRef.current = null;
        }

        const graph = buildGraph(data, centerId);
        graphRef.current = graph;

        // Run ForceAtlas2 layout synchronously
        forceAtlas2.assign(graph, {
            iterations: 60,
            settings: {
                gravity: 1,
                scalingRatio: 2,
                barnesHutOptimize: true,
                barnesHutTheta: 0.5,
                strongGravityMode: false,
                adjustSizes: true,
            },
        });

        const sigma = new Sigma(graph, containerRef.current, {
            renderLabels: true,
            labelSize: 12,
            labelColor: { color: '#e5e7eb' },
            labelRenderedSizeThreshold: 6,
            defaultNodeType: 'circle',
            defaultEdgeType: 'line',
            stagePadding: 30,
        });

        sigmaRef.current = sigma;

        // Double-click to re-center
        sigma.on('doubleClickNode', ({ node }) => {
            handleDoubleClick(node);
        });

        // Hover interactions
        sigma.on('enterNode', ({ node }) => {
            setHoveredNode(node);
        });

        sigma.on('leaveNode', () => {
            setHoveredNode(null);
        });

        // Center camera on center node
        const centerNodePos = graph.getNodeAttributes(centerId);
        if (centerNodePos) {
            sigma
                .getCamera()
                .animate({ x: centerNodePos.x, y: centerNodePos.y, ratio: 0.5 }, { duration: 300 });
        }

        return () => {
            sigma.kill();
            sigmaRef.current = null;
        };
    }, [data, centerId, handleDoubleClick]);

    // Hover highlight effect via node reducer
    useEffect(() => {
        const sigma = sigmaRef.current;
        const graph = graphRef.current;
        if (!sigma || !graph) return;

        sigma.setSetting('nodeReducer', (node, attrs) => {
            if (!hoveredNode) return attrs;

            const isNeighbor = node === hoveredNode || graph.areNeighbors(node, hoveredNode);

            return {
                ...attrs,
                color: isNeighbor ? attrs.color : `${attrs.color}33`,
                label: isNeighbor ? attrs.label : '',
            };
        });

        sigma.setSetting('edgeReducer', (edge, attrs) => {
            if (!hoveredNode) return attrs;

            const src = graph.source(edge);
            const tgt = graph.target(edge);
            const isConnected = src === hoveredNode || tgt === hoveredNode;

            return {
                ...attrs,
                color: isConnected ? 'rgba(150, 150, 150, 0.5)' : 'rgba(150, 150, 150, 0.02)',
            };
        });

        sigma.refresh();
    }, [hoveredNode]);

    return <div ref={containerRef} className="h-full w-full" style={{ background: '#0a0a0a' }} />;
}
