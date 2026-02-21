// types/graph.ts - Graph view type definitions

export type NodeType = 'event' | 'venue' | 'artist' | 'entry';

export interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    metadata: Record<string, unknown>;
}

export interface GraphEdge {
    id: string;
    source_id: string;
    source_type: string;
    target_id: string;
    target_type: string;
    weight: number;
    context: string;
}

export interface LocalGraphData {
    center_id: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export const NODE_COLORS: Record<NodeType, string> = {
    event: '#f59e0b',
    venue: '#3b82f6',
    artist: '#ec4899',
    entry: '#6b7280',
};

export const WEIGHT_MAP: Record<string, number> = {
    venue: 9,
    lineup: 8,
    event_reference: 7,
    description_mention: 3,
};
