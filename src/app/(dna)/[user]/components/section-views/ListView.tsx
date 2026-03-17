import type { ContentEntry } from '@/types/domain';
import { formatDateCompact } from '@/lib/formatters';
import { getEntryHref } from '@/lib/utils/entry-link';
import { Timeline, type TimelineEntry } from '@/components/dna/Timeline';

interface ListViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

function toTimelineEntry(entry: ContentEntry, username: string): TimelineEntry {
    const date =
        entry.type === 'event' ? formatDateCompact(entry.date) : formatDateCompact(entry.createdAt);

    const venue =
        entry.type === 'event' && entry.venue?.name
            ? entry.venue.name
            : entry.type === 'mixset'
              ? entry.durationMinutes
                  ? `${entry.durationMinutes}min`
                  : 'Mixset'
              : entry.type === 'link'
                ? (() => {
                      try {
                          return new URL(entry.url).hostname;
                      } catch {
                          return 'Link';
                      }
                  })()
                : entry.type;

    const link = getEntryHref(entry, username) ?? undefined;

    const artists =
        entry.type === 'event' && entry.lineup?.length > 0
            ? entry.lineup.map((a) => ({ name: a.name }))
            : undefined;

    return { date, title: entry.title || 'Untitled', venue, link, artists };
}

export function ListView({ entries, username }: ListViewProps) {
    return <Timeline entries={entries.map((e) => toTimelineEntry(e, username))} />;
}
