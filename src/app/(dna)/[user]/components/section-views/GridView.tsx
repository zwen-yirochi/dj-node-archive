import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

interface GridViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

export function GridView({ entries, username }: GridViewProps) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {entries.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry} index={i} username={username} />
            ))}
        </div>
    );
}
