import type { ContentEntry } from '@/types/domain';
import { EntryFeatureCard } from '@/components/dna/entry-renderers/EntryFeatureCard';

interface FeatureViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

export function FeatureView({ entries, username }: FeatureViewProps) {
    const featured = entries[0];
    if (!featured) return null;

    return (
        <div className="my-3">
            <EntryFeatureCard entry={featured} username={username} />
        </div>
    );
}
