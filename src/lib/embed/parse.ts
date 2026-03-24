import { providers } from './providers';
import type { ParsedEmbed } from './types';

export function parseEmbedUrl(url: string): ParsedEmbed | null {
    if (!url) return null;

    for (const provider of providers) {
        for (const regex of provider.regex) {
            const match = url.match(regex);
            if (match) {
                return {
                    provider: provider.name,
                    displayName: provider.displayName,
                    embedUrl: provider.toEmbedUrl(match),
                    dimensions: provider.dimensions,
                };
            }
        }
    }

    return null;
}
