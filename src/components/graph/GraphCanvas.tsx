'use client';

import { useEffect, useRef, useState } from 'react';
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

const FA2_SETTINGS = {
    scalingRatio: 15,
    gravity: 0.05,
    strongGravityMode: true,
    linLogMode: false,
    edgeWeightInfluence: 1,
    outboundAttractionDistribution: false,
    adjustSizes: false,
    barnesHutOptimize: false,
    barnesHutTheta: 0.5,
} as const;

function nodeAttrs(
    node: { id: string; type: NodeType; label: string },
    degree: number,
    isCenter: boolean
) {
    const size = Math.max(4, Math.log2(degree + 1) * 3);
    const color = NODE_COLORS[node.type] || NODE_COLORS.entry;
    return {
        label: node.label,
        size: isCenter ? size * 1.6 : size,
        color: isCenter ? '#1a1a1e' : color,
    };
}

export default function GraphCanvas({ data, centerId, onRecenter }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const animFrameRef = useRef<number>(0);
    const onRecenterRef = useRef(onRecenter);
    const centerIdRef = useRef(centerId);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    onRecenterRef.current = onRecenter;
    centerIdRef.current = centerId;

    // Initialize Sigma once
    useEffect(() => {
        if (!containerRef.current) return;

        const graph = new Graph();
        graphRef.current = graph;

        const sigma = new Sigma(graph, containerRef.current, {
            renderLabels: true,
            labelSize: 11,
            labelColor: { color: '#1a1a1e' },
            labelFont: "'JetBrains Mono', monospace",
            labelRenderedSizeThreshold: 5,
            defaultNodeType: 'circle',
            defaultEdgeType: 'line',
            stagePadding: 40,
            doubleClickZoomingDuration: 0,
        });

        sigmaRef.current = sigma;

        sigma.on('clickNode', ({ node }) => {
            if (node !== centerIdRef.current) {
                onRecenterRef.current(node);
            }
        });
        sigma.on('doubleClickNode', (e) => e.preventSigmaDefault());
        sigma.on('doubleClickStage', (e) => e.preventSigmaDefault());
        sigma.on('enterNode', ({ node }) => setHoveredNode(node));
        sigma.on('leaveNode', () => setHoveredNode(null));

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            sigma.kill();
            sigmaRef.current = null;
            graphRef.current = null;
        };
    }, []);

    // Merge new data into existing graph (never remove, only add + update center)
    useEffect(() => {
        const graph = graphRef.current;
        const sigma = sigmaRef.current;
        if (!graph || !sigma || !data || data.nodes.length === 0) return;

        cancelAnimationFrame(animFrameRef.current);

        const isFirstRender = graph.order === 0;

        // Get anchor position: clicked node's current position, or origin
        let cx = 0;
        let cy = 0;
        if (graph.hasNode(centerId)) {
            cx = graph.getNodeAttribute(centerId, 'x');
            cy = graph.getNodeAttribute(centerId, 'y');
        }

        // Add/update nodes
        for (const node of data.nodes) {
            const degree = data.edges.filter(
                (e) => e.source_id === node.id || e.target_id === node.id
            ).length;
            const isCenter = node.id === centerId;
            const attrs = nodeAttrs(
                node as { id: string; type: NodeType; label: string },
                degree,
                isCenter
            );

            if (graph.hasNode(node.id)) {
                // Update existing: refresh center styling
                graph.mergeNodeAttributes(node.id, attrs);
            } else {
                // New node: place near the center node
                const angle = Math.random() * Math.PI * 2;
                const r = isFirstRender ? 0.5 + Math.random() * 0.5 : 1 + Math.random() * 2;
                graph.addNode(node.id, {
                    ...attrs,
                    x: isCenter && isFirstRender ? 0 : cx + Math.cos(angle) * r,
                    y: isCenter && isFirstRender ? 0 : cy + Math.sin(angle) * r,
                });
            }
        }

        // Add new edges (skip existing)
        for (const edge of data.edges) {
            if (!graph.hasNode(edge.source_id) || !graph.hasNode(edge.target_id)) continue;
            if (graph.hasEdge(edge.source_id, edge.target_id)) continue;
            graph.addEdge(edge.source_id, edge.target_id, {
                size: Math.max(0.5, edge.weight / 5),
                color: `rgba(26, 26, 30, ${0.15 + (edge.weight / 10) * 0.35})`,
            });
        }

        // Camera → move to new center immediately (before physics)
        if (!isFirstRender) {
            const pos = sigma.getNodeDisplayData(centerId);
            if (pos) {
                sigma.getCamera().animate({ x: pos.x, y: pos.y, ratio: 0.8 }, { duration: 300 });
            }
        }

        // Physics — initial: full sim, transition: light settle
        let iteration = 0;
        const totalFrames = isFirstRender ? 300 : 60;
        const baseSlowDown = 1 + Math.log(graph.order);
        const decayRate = isFirstRender ? 0.99 : 0.95; // transitions settle faster

        const g = graph; // capture non-null for closure
        function tick() {
            if (iteration >= totalFrames) return;
            const alpha = Math.pow(decayRate, iteration);
            forceAtlas2.assign(g, {
                iterations: 1,
                settings: {
                    ...FA2_SETTINGS,
                    slowDown: baseSlowDown / alpha,
                    barnesHutOptimize: g.order > 200,
                },
            });
            iteration++;
            animFrameRef.current = requestAnimationFrame(tick);
        }

        animFrameRef.current = requestAnimationFrame(tick);
    }, [data, centerId]);

    // Hover highlight
    useEffect(() => {
        const sigma = sigmaRef.current;
        const graph = graphRef.current;
        if (!sigma || !graph) return;

        sigma.setSetting('nodeReducer', (node, attrs) => {
            if (!hoveredNode) return attrs;
            const isNeighbor = node === hoveredNode || graph.areNeighbors(node, hoveredNode);
            if (isNeighbor) {
                return { ...attrs, highlighted: true };
            }
            return attrs;
        });

        sigma.setSetting('edgeReducer', (edge, attrs) => {
            if (!hoveredNode) return attrs;
            const src = graph.source(edge);
            const tgt = graph.target(edge);
            const isConnected = src === hoveredNode || tgt === hoveredNode;
            if (isConnected) {
                return { ...attrs, color: 'rgba(74, 74, 82, 0.15)' };
            }
            return attrs;
        });

        sigma.refresh();
    }, [hoveredNode]);

    return (
        <div ref={containerRef} className="h-full w-full" style={{ background: 'transparent' }} />
    );
}
