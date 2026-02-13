import type { Event } from '@/types/domain';

interface Props {
    event: Event;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d
            .toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
            .toUpperCase();
    } catch {
        return dateStr;
    }
}

export default function EventDetail({ event }: Props) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Hero Poster */}
            {event.posterUrl ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <img
                        src={event.posterUrl}
                        alt={event.title}
                        className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                </div>
            ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-[#111]">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#333]">
                        No Poster
                    </span>
                </div>
            )}

            {/* Content */}
            <div className="relative -mt-16 flex flex-1 flex-col gap-6 px-5 pb-10">
                {/* Meta Bar */}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[#666]">
                    <span>{formatDate(event.date)}</span>
                    {event.venue?.name && (
                        <>
                            <span className="text-[#333]">/</span>
                            <span>{event.venue.name}</span>
                        </>
                    )}
                </div>

                {/* Title */}
                <h1 className="m-0 text-2xl font-bold uppercase leading-[1.1] tracking-[0.04em] text-white">
                    {event.title}
                </h1>

                {/* Divider */}
                <div className="h-px w-full bg-[#222]" />

                {/* Lineup */}
                {event.lineup.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#555]">
                            Lineup
                        </h2>
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                            {event.lineup.map((artist, i) => (
                                <li
                                    key={i}
                                    className="text-sm font-medium uppercase tracking-[0.06em] text-[#ccc]"
                                >
                                    {artist.name}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Description */}
                {event.description && (
                    <section>
                        <div className="h-px w-full bg-[#222]" />
                        <p className="mt-4 text-xs uppercase leading-relaxed tracking-[0.04em] text-[#888]">
                            {event.description}
                        </p>
                    </section>
                )}

                {/* External Links */}
                {event.links && event.links.length > 0 && (
                    <section className="mt-2">
                        <div className="h-px w-full bg-[#222]" />
                        <div className="mt-4 flex flex-col gap-2">
                            {event.links.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between border border-[#222] px-4 py-3 text-xs uppercase tracking-[0.08em] text-[#ccc] no-underline transition-colors hover:border-[#444] hover:text-white"
                                >
                                    <span>{link.title}</span>
                                    <span className="text-[10px] text-[#555]">&rarr;</span>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
