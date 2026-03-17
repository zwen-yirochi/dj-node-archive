import type { EmbedBlockData } from '@/types/domain';

function getHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return 'Link';
    }
}

interface EmbedBlockViewProps {
    data: EmbedBlockData;
}

export function EmbedBlockView({ data }: EmbedBlockViewProps) {
    if (!data.url) return null;

    return (
        <div className="py-4">
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-dna-ink-faint px-4 py-3 text-dna-meta-val uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink-light hover:text-dna-ink"
            >
                <span>{data.provider || getHostname(data.url)}</span>
                <span className="ml-2 text-dna-ink-ghost">&rarr;</span>
            </a>
        </div>
    );
}
