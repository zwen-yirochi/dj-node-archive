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
        const size = Math.max(4, Math.log2(degree + 1) * 3);
        const color = NODE_COLORS[node.type as NodeType] || NODE_COLORS.entry;
        const isCenter = node.id === centerId;

        // Center at origin, others in a small circle around it
        // → repulsion creates the "big bang" expanding effect
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.5;

        graph.addNode(node.id, {
            label: node.label,
            size: isCenter ? size * 1.6 : size,
            color: isCenter ? '#1a1a1e' : color, // dna-ink for center
            x: isCenter ? 0 : Math.cos(angle) * radius,
            y: isCenter ? 0 : Math.sin(angle) * radius,
        });
    }

    for (const edge of data.edges) {
        if (!graph.hasNode(edge.source_id) || !graph.hasNode(edge.target_id)) continue;
        if (graph.hasEdge(edge.source_id, edge.target_id)) continue;

        graph.addEdge(edge.source_id, edge.target_id, {
            size: Math.max(0.5, edge.weight / 5),
            color: `rgba(26, 26, 30, ${0.15 + (edge.weight / 10) * 0.35})`, // dna-ink based
        });
    }

    return graph;
}

export default function GraphCanvas({ data, centerId, onRecenter }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const animFrameRef = useRef<number>(0);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const handleDoubleClick = useCallback(
        (nodeId: string) => {
            if (nodeId !== centerId) {
                onRecenter(nodeId);
            }
        },
        [centerId, onRecenter]
    );

    useEffect(() => {
        if (!containerRef.current || data.nodes.length === 0) return;

        if (sigmaRef.current) {
            sigmaRef.current.kill();
            sigmaRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }

        const graph = buildGraph(data, centerId);
        graphRef.current = graph;

        const sigma = new Sigma(graph, containerRef.current, {
            renderLabels: true,
            labelSize: 11,
            labelColor: { color: '#1a1a1e' }, // dna-ink
            labelFont: "'JetBrains Mono', monospace",
            labelRenderedSizeThreshold: 5,
            defaultNodeType: 'circle',
            defaultEdgeType: 'line',
            stagePadding: 40,
            doubleClickZoomingDuration: 0,
        });

        sigmaRef.current = sigma;

        // Obsidian-like physics:
        //   High repulsion (scalingRatio 8) → nodes push apart aggressively
        //   Weak gravity (0.05) → doesn't crush inward
        //   strongGravityMode → prevents disconnected components from drifting away
        //   linLogMode false → linear spring attraction (Hooke's law feel)
        //   Alpha decay → exponential cooldown like d3-force (~300 ticks)
        let iteration = 0;
        const totalFrames = 300;
        const baseSlowDown = 1 + Math.log(graph.order);

        function tick() {
            if (iteration >= totalFrames) return;

            // Exponential alpha decay (d3-force style)
            // alpha starts at 1.0, decays toward 0
            const alpha = Math.pow(0.99, iteration); // ~0.95 at 5, ~0.74 at 30, ~0.37 at 100, ~0.05 at 300

            forceAtlas2.assign(graph, {
                iterations: 1,
                settings: {
                    scalingRatio: 15,
                    gravity: 0.05,
                    strongGravityMode: true,
                    linLogMode: false,
                    edgeWeightInfluence: 1,
                    outboundAttractionDistribution: false,
                    adjustSizes: false,
                    // slowDown increases as alpha decays → natural settling
                    slowDown: baseSlowDown / alpha,
                    barnesHutOptimize: graph.order > 200,
                    barnesHutTheta: 0.5,
                },
            });

            iteration++;
            animFrameRef.current = requestAnimationFrame(tick);
        }

        animFrameRef.current = requestAnimationFrame(tick);

        // Interactions
        sigma.on('doubleClickNode', (e) => {
            e.preventSigmaDefault();
            handleDoubleClick(e.node);
        });
        sigma.on('doubleClickStage', (e) => {
            e.preventSigmaDefault();
        });
        sigma.on('enterNode', ({ node }) => setHoveredNode(node));
        sigma.on('leaveNode', () => setHoveredNode(null));

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            sigma.kill();
            sigmaRef.current = null;
        };
    }, [data, centerId, handleDoubleClick]);

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
        <div
            ref={containerRef}
            className="h-full w-full"
            style={{ background: 'rgb(218, 222, 224)' }}
        />
    );
}
