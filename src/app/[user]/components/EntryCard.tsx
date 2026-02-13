import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';

interface Props {
    entry: ContentEntry;
    index: number;
}

function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'event') return (entry as EventEntry).posterUrl;
    if (entry.type === 'mixset') return (entry as MixsetEntry).coverUrl;
    return undefined;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            })
            .toUpperCase();
    } catch {
        return dateStr;
    }
}

function getTitle(entry: ContentEntry): string {
    if (entry.type === 'event') return (entry as EventEntry).title;
    if (entry.type === 'mixset') return (entry as MixsetEntry).title;
    return (entry as LinkEntry).title;
}

function renderMeta(entry: ContentEntry) {
    switch (entry.type) {
        case 'event': {
            const e = entry as EventEntry;
            if (!e.venue?.name) return null;
            return (
                <div className="text-[10px] tracking-[0.04em] text-[#6b6b6b]">@{e.venue.name}</div>
            );
        }
        case 'mixset': {
            const m = entry as MixsetEntry;
            if (!m.durationMinutes) return null;
            return (
                <div className="text-[10px] tracking-[0.04em] text-[#6b6b6b]">
                    {m.durationMinutes}MIN
                </div>
            );
        }
        case 'link': {
            const l = entry as LinkEntry;
            return (
                <div className="text-[10px] tracking-[0.04em] text-[#6b6b6b]">
                    {new URL(l.url).hostname}
                </div>
            );
        }
    }
}

function getSideValue(entry: ContentEntry): string {
    if (entry.type === 'event') return formatDate((entry as EventEntry).date);
    if (entry.type === 'mixset') return formatDate(entry.createdAt);
    return entry.type.toUpperCase();
}

const accentColor: Record<string, string> = {
    event: 'bg-[#1a1a1a]',
    mixset: 'bg-[#6b6b6b]',
    link: 'bg-[#999]',
};

export default function EntryCard({ entry, index }: Props) {
    const imageUrl = getImageUrl(entry);

    return (
        <article
            className="hover:bg-black/2 grid animate-fade-in-up grid-cols-[3px_60px_1fr_auto] gap-x-3 border-b border-black/5 py-1.5 transition-colors"
            style={{ animationDelay: `${0.1 + index * 0.08}s` }}
        >
            <div className={`row-span-full h-full w-[2px] rounded-sm`} />
            <div className="bg-black/4 border-black/6 row-span-full h-[75px] w-[60px] overflow-hidden rounded-sm border">
                {imageUrl ? (
                    <img className="size-full object-cover" src={imageUrl} alt="" />
                ) : (
                    <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-[0.05em] text-[#999]">
                        {entry.type.slice(0, 3)}
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
                <h3 className="m-0 text-xs font-semibold uppercase leading-tight tracking-[0.06em] text-[#1a1a1a]">
                    {getTitle(entry)}
                </h3>
                {renderMeta(entry)}
            </div>
            <div className="self-start whitespace-nowrap pt-0.5 text-right text-[10px] tracking-[0.04em] text-[#999]">
                {getSideValue(entry)}
            </div>
        </article>
    );
}
