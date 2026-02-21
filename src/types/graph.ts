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
    event: '#4a4a52', // dna-ink-mid
    venue: '#505868', // muted steel blue
    artist: '#6b4a4a', // muted dusty red
    entry: '#a0a0ac', // dna-ink-ghost
};

export const WEIGHT_MAP: Record<string, number> = {
    venue: 9,
    lineup: 8,
    event_reference: 7,
    description_mention: 3,
};
