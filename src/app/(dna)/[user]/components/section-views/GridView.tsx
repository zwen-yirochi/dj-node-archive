import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

interface GridViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
}

export function GridView({ entries }: GridViewProps) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {entries.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry} index={i} />
            ))}
        </div>
    );
}
