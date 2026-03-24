import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { SectionLabel } from '@/components/dna/SectionLabel';

interface Track {
    track: string;
    artist: string;
    time: string;
}

interface TracklistTimelineProps {
    tracklist: Track[];
}

export function TracklistTimeline({ tracklist }: TracklistTimelineProps) {
    if (!tracklist || tracklist.length === 0) return null;

    return (
        <>
            <AsciiDivider text="TRACKLIST" />
            <section className="my-5">
                <SectionLabel right={`${tracklist.length} TRACKS`}>Tracklist</SectionLabel>
                <div className="my-3">
                    {tracklist.map((track, i) => (
                        <div
                            key={i}
                            className="dna-border-row flex items-center gap-3 border-b py-2.5 last:border-b-0"
                        >
                            <span className="min-w-[40px] text-dna-label text-dna-ink-ghost">
                                {track.time || String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1">
                                <span className="text-dna-body font-medium">{track.track}</span>
                                {track.artist && (
                                    <span className="ml-2 text-dna-label text-dna-ink-light">
                                        — {track.artist}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
