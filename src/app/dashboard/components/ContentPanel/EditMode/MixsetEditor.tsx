'use client';

import type { MixsetComponent } from '@/types';
import { Music, Plus, X } from 'lucide-react';
import Image from 'next/image';

interface MixsetEditorProps {
    component: MixsetComponent;
    onUpdate: (updates: Partial<MixsetComponent>) => void;
}

export default function MixsetEditor({ component, onUpdate }: MixsetEditorProps) {
    const addTrack = () => {
        onUpdate({
            tracklist: [...component.tracklist, { track: '', artist: '', time: '0:00' }],
        });
    };

    const updateTrack = (index: number, field: 'track' | 'artist' | 'time', value: string) => {
        const newTracklist = [...component.tracklist];
        newTracklist[index] = { ...newTracklist[index], [field]: value };
        onUpdate({ tracklist: newTracklist });
    };

    const removeTrack = (index: number) => {
        onUpdate({
            tracklist: component.tracklist.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            {/* Cover Image */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    커버 이미지
                </label>
                <div
                    className={`rounded-xl border-2 border-dashed p-4 ${component.coverUrl ? 'border-dashboard-border-hover' : 'border-dashboard-border'}`}
                >
                    {component.coverUrl ? (
                        <div className="relative mx-auto aspect-square max-w-[200px]">
                            <Image
                                src={component.coverUrl}
                                alt="커버"
                                fill
                                className="rounded-lg object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ coverUrl: '' })}
                                className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Music className="mx-auto mb-3 h-10 w-10 text-dashboard-text-placeholder" />
                            <p className="text-sm text-dashboard-text-muted">
                                클릭하여 커버 업로드
                            </p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="mt-4 w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-center text-sm focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                                onChange={(e) => onUpdate({ coverUrl: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Genre */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={component.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                        placeholder="믹스셋 제목"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                        장르
                    </label>
                    <input
                        type="text"
                        value={component.genre}
                        onChange={(e) => onUpdate({ genre: e.target.value })}
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                        placeholder="Techno, House, etc."
                    />
                </div>
            </div>

            {/* Release Date */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    발매일
                </label>
                <input
                    type="date"
                    value={component.releaseDate}
                    onChange={(e) => onUpdate({ releaseDate: e.target.value })}
                    className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                />
            </div>

            {/* SoundCloud Embed */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    SoundCloud 임베드 URL
                </label>
                <input
                    type="text"
                    value={component.soundcloudEmbedUrl || ''}
                    onChange={(e) => onUpdate({ soundcloudEmbedUrl: e.target.value })}
                    className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="https://w.soundcloud.com/player/?url=..."
                />
            </div>

            {/* Tracklist */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    트랙리스트
                </label>
                <div className="space-y-2">
                    {component.tracklist.map((track, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={track.time}
                                onChange={(e) => updateTrack(index, 'time', e.target.value)}
                                placeholder="0:00"
                                className="w-16 rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-2 py-2 text-center text-sm focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                            />
                            <input
                                type="text"
                                value={track.track}
                                onChange={(e) => updateTrack(index, 'track', e.target.value)}
                                placeholder="트랙 제목"
                                className="flex-1 rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-sm focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                            />
                            <input
                                type="text"
                                value={track.artist}
                                onChange={(e) => updateTrack(index, 'artist', e.target.value)}
                                placeholder="아티스트"
                                className="flex-1 rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-sm focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                            />
                            <button
                                onClick={() => removeTrack(index)}
                                className="p-2 text-dashboard-text-placeholder transition-colors hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addTrack}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-3 text-dashboard-text-muted transition-colors hover:border-dashboard-border-hover hover:text-dashboard-text-secondary"
                    >
                        <Plus className="h-4 w-4" />
                        트랙 추가
                    </button>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    설명
                </label>
                <textarea
                    value={component.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full resize-none rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="믹스셋에 대한 설명..."
                    rows={3}
                />
            </div>
        </div>
    );
}
