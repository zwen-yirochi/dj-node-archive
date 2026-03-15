import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

interface ListViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
}

export function ListView({ entries }: ListViewProps) {
    return (
        <div className="my-3">
            {entries.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry} index={i} />
            ))}
        </div>
    );
}
