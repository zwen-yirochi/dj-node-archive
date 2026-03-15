import type { ContentEntry } from '@/types/domain';
import { EntryCard } from '@/components/dna/EntryCard';

interface CarouselViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
}

export function CarouselView({ entries }: CarouselViewProps) {
    return (
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
            {entries.map((entry, i) => (
                <div key={entry.id} className="w-72 flex-shrink-0">
                    <EntryCard entry={entry} index={i} />
                </div>
            ))}
        </div>
    );
}
