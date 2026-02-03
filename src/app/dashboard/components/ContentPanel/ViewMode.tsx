'use client';

import { Button } from '@/components/ui/button';
import {
    type ComponentData,
    type EventComponent,
    isEventComponent,
    isLinkComponent,
    isMixsetComponent,
    type LinkComponent,
    type MixsetComponent,
} from '@/types';
import {
    Calendar,
    ExternalLink,
    Globe,
    Headphones,
    Instagram,
    Link as LinkIcon,
    Mail,
    MapPin,
    Music,
    Pencil,
    Trash2,
    Users,
    Youtube,
} from 'lucide-react';
import Image from 'next/image';

interface ViewModeProps {
    component: ComponentData;
    onEdit: () => void;
    onDelete: () => void;
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
};

export default function ViewMode({ component, onEdit, onDelete }: ViewModeProps) {
    const getTypeColor = () => {
        switch (component.type) {
            case 'show':
                return 'bg-blue-50 text-dashboard-type-event border-blue-200';
            case 'mixset':
                return 'bg-purple-50 text-dashboard-type-mixset border-purple-200';
            case 'link':
                return 'bg-green-50 text-dashboard-type-link border-green-200';
        }
    };

    const getTypeIcon = () => {
        switch (component.type) {
            case 'show':
                return <Calendar className="h-4 w-4" />;
            case 'mixset':
                return <Headphones className="h-4 w-4" />;
            case 'link':
                return <LinkIcon className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()}`}
                >
                    {getTypeIcon()}
                    {component.type}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onEdit}
                        size="sm"
                        className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                    >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        편집
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isEventComponent(component) && <ShowDetail component={component} />}
                {isMixsetComponent(component) && <MixsetDetail component={component} />}
                {isLinkComponent(component) && <LinkDetail component={component} />}
            </div>
        </div>
    );
}

function ShowDetail({ component }: { component: EventComponent }) {
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

function MixsetDetail({ component }: { component: MixsetComponent }) {
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

function LinkDetail({ component }: { component: LinkComponent }) {
    const IconComponent = iconComponents[component.icon] || Globe;

    return (
        <div className="space-y-4 py-4 text-center">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted">
                <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-dashboard-text">
                {component.title || '제목 없음'}
            </h2>

            {/* URL */}
            <a
                href={component.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text-secondary"
            >
                <ExternalLink className="h-3.5 w-3.5" />
                {component.url}
            </a>
        </div>
    );
}
