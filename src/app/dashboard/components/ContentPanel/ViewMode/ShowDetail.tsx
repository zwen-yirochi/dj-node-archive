import type { EventComponent } from '@/types';
import { Calendar, ExternalLink, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

interface ShowDetailProps {
    component: EventComponent;
}

export default function ShowDetail({ component }: ShowDetailProps) {
    return (
        <div className="space-y-4">
            {/* Poster */}
            {component.posterUrl && (
                <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-xl">
                    <Image
                        src={component.posterUrl}
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

            {/* Info Grid */}
            <div className="space-y-3 rounded-xl bg-dashboard-bg-muted p-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-dashboard-text-placeholder" />
                    <span className="text-dashboard-text-secondary">{component.date || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-dashboard-text-placeholder" />
                    <span className="text-dashboard-text-secondary">{component.venue || '-'}</span>
                </div>
                {component.lineup && component.lineup.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                        <Users className="mt-0.5 h-4 w-4 text-dashboard-text-placeholder" />
                        <div className="flex flex-wrap gap-1.5">
                            {component.lineup.map((artist, i) => (
                                <span
                                    key={i}
                                    className="rounded-full bg-dashboard-bg-active px-2.5 py-0.5 text-xs text-dashboard-text-secondary"
                                >
                                    {artist}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Description */}
            {component.description && (
                <p className="text-sm leading-relaxed text-dashboard-text-muted">
                    {component.description}
                </p>
            )}

            {/* Links */}
            {component.links && component.links.length > 0 && (
                <div className="space-y-2">
                    {component.links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-dashboard-bg-muted px-3 py-2 text-sm text-dashboard-text-secondary transition-colors hover:bg-dashboard-bg-active hover:text-dashboard-text"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {link.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
