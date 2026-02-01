'use client';

import { Button } from '@/components/ui/button';
import type { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import { motion } from 'framer-motion';
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
    X,
    Youtube,
} from 'lucide-react';
import Image from 'next/image';

interface ComponentDetailProps {
    component: ComponentData;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
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

export default function ComponentDetail({
    component,
    onEdit,
    onDelete,
    onClose,
}: ComponentDetailProps) {
    const getTypeColor = () => {
        switch (component.type) {
            case 'show':
                return 'bg-[#ff2d92]/15 text-[#ff2d92] border-[#ff2d92]/30';
            case 'mixset':
                return 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30';
            case 'link':
                return 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/30';
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()}`}
                    >
                        {getTypeIcon()}
                        {component.type}
                    </span>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-5">
                    {component.type === 'show' && (
                        <ShowDetail component={component as EventComponent} />
                    )}
                    {component.type === 'mixset' && (
                        <MixsetDetail component={component as MixsetComponent} />
                    )}
                    {component.type === 'link' && (
                        <LinkDetail component={component as LinkComponent} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        삭제
                    </Button>
                    <Button
                        onClick={onEdit}
                        size="sm"
                        className="bg-white/10 text-white hover:bg-white/20"
                    >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        편집
                    </Button>
                </div>
            </motion.div>
        </motion.div>
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
            <h2 className="text-center text-xl font-bold text-white">
                {component.title || '제목 없음'}
            </h2>

            {/* Info Grid */}
            <div className="space-y-3 rounded-xl bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-white/40" />
                    <span className="text-white/80">{component.date || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-white/40" />
                    <span className="text-white/80">{component.venue || '-'}</span>
                </div>
                {component.lineup && component.lineup.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                        <Users className="mt-0.5 h-4 w-4 text-white/40" />
                        <div className="flex flex-wrap gap-1.5">
                            {component.lineup.map((artist, i) => (
                                <span
                                    key={i}
                                    className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70"
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
                <p className="text-sm leading-relaxed text-white/60">{component.description}</p>
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
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
            <h2 className="text-center text-xl font-bold text-white">
                {component.title || '제목 없음'}
            </h2>

            {/* Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                {component.genre && <span>{component.genre}</span>}
                {component.releaseDate && (
                    <>
                        <span className="h-1 w-1 rounded-full bg-white/30" />
                        <span>{component.releaseDate}</span>
                    </>
                )}
            </div>

            {/* Description */}
            {component.description && (
                <p className="text-sm leading-relaxed text-white/60">{component.description}</p>
            )}

            {/* Tracklist */}
            {component.tracklist && component.tracklist.length > 0 && (
                <div className="rounded-xl bg-white/5 p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                        Tracklist
                    </h3>
                    <div className="space-y-2">
                        {component.tracklist.map((track, i) => (
                            <div key={i} className="flex items-baseline gap-3 text-sm">
                                <span className="w-12 shrink-0 font-mono text-xs text-white/30">
                                    {track.time}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="text-white/80">{track.track}</span>
                                    {track.artist && (
                                        <span className="text-white/40"> — {track.artist}</span>
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <IconComponent className="h-8 w-8 text-white/70" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white">{component.title || '제목 없음'}</h2>

            {/* URL */}
            <a
                href={component.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/80"
            >
                <ExternalLink className="h-3.5 w-3.5" />
                {component.url}
            </a>
        </div>
    );
}
