import type { MixsetComponent } from '@/types';
import Image from 'next/image';

interface MixsetDetailProps {
    component: MixsetComponent;
}

export default function MixsetDetail({ component }: MixsetDetailProps) {
    return (
        <div className="space-y-4">
            {/* Cover */}
            {component.coverUrl && (
                <div className="relative mx-auto aspect-square max-w-[200px] overflow-hidden rounded-xl">
                    <Image
                        src={component.coverUrl}
                        alt={component.title}
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* Title */}
            <h2 className="text-center text-xl font-bold text-dashboard-text">
                {component.title || '제목 없음'}
            </h2>

            {/* Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-dashboard-text-muted">
                {component.genre && <span>{component.genre}</span>}
                {component.releaseDate && (
                    <>
                        <span className="h-1 w-1 rounded-full bg-dashboard-border-hover" />
                        <span>{component.releaseDate}</span>
                    </>
                )}
            </div>

            {/* Description */}
            {component.description && (
                <p className="text-sm leading-relaxed text-dashboard-text-muted">
                    {component.description}
                </p>
            )}

            {/* Tracklist */}
            {component.tracklist && component.tracklist.length > 0 && (
                <div className="rounded-xl bg-dashboard-bg-muted p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                        Tracklist
                    </h3>
                    <div className="space-y-2">
                        {component.tracklist.map((track, i) => (
                            <div key={i} className="flex items-baseline gap-3 text-sm">
                                <span className="w-12 shrink-0 font-mono text-xs text-dashboard-text-placeholder">
                                    {track.time}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="text-dashboard-text-secondary">
                                        {track.track}
                                    </span>
                                    {track.artist && (
                                        <span className="text-dashboard-text-placeholder">
                                            {' '}
                                            — {track.artist}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
