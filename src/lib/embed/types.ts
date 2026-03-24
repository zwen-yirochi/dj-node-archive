export interface EmbedProvider {
    name: string;
    displayName: string;
    regex: RegExp[];
    toEmbedUrl: (match: RegExpMatchArray) => string;
    dimensions: { aspectRatio: string } | { height: number };
}

export interface ParsedEmbed {
    provider: string;
    displayName: string;
    embedUrl: string;
    dimensions: { aspectRatio: string } | { height: number };
}
