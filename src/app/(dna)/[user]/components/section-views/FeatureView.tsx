import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

interface FeatureViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
}

export function FeatureView({ entries }: FeatureViewProps) {
    const featured = entries[0];
    if (!featured) return null;

    return (
        <div className="my-3">
            <EntryCard entry={featured} index={0} />
        </div>
    );
}
