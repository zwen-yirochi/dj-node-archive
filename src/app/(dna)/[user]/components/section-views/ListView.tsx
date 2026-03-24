import type { ContentEntry } from '@/types/domain';
import { toEntryTimelineData } from '@/components/dna/entry-renderers/EntryListItem';
import { Timeline } from '@/components/dna/Timeline';

interface ListViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

export function ListView({ entries, username }: ListViewProps) {
    return <Timeline entries={entries.map((e) => toEntryTimelineData(e, username))} />;
}
