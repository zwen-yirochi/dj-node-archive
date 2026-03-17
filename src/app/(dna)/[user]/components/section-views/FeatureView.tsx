import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

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
            <EntryCard entry={featured} index={0} username={username} />
        </div>
    );
}
