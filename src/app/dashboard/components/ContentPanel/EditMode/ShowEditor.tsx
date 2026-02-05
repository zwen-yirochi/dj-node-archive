'use client';

import type { EventEntry } from '@/types';
import { Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface EventEditorProps {
    component: EventEntry;
    onUpdate: (updates: Partial<EventEntry>) => void;
}

export default function EventEditor({ component, onUpdate }: EventEditorProps) {
    const [tagInput, setTagInput] = useState('');

    const addTag = (username: string) => {
        const name = username.startsWith('@') ? username : `@${username}`;
        const newPerformer = { name };
        if (!component.lineup.some((p) => p.name === name)) {
            onUpdate({ lineup: [...component.lineup, newPerformer] });
        }
        setTagInput('');
    };

    const removeTag = (performer: { id?: string; name: string }) => {
        onUpdate({ lineup: component.lineup.filter((p) => p.name !== performer.name) });
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
        if (e.key === 'Backspace' && tagInput === '' && component.lineup.length > 0) {
            removeTag(component.lineup[component.lineup.length - 1]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Poster Image */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    포스터 이미지
                </label>
                <div
                    className={`rounded-xl border-2 border-dashed p-4 ${component.posterUrl ? 'border-dashboard-border-hover' : 'border-dashboard-border'}`}
                >
                    {component.posterUrl ? (
                        <div className="relative aspect-[3/4] max-w-[200px]">
                            <Image
                                src={component.posterUrl}
                                alt="포스터"
                                fill
                                className="rounded-lg object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ posterUrl: '' })}
                                className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-dashboard-text-placeholder" />
                            <p className="text-sm text-dashboard-text-muted">
                                클릭하여 포스터 업로드
                            </p>
                            <p className="mt-1 text-xs text-dashboard-text-placeholder">
                                권장: 3:4 비율
                            </p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="mt-4 w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-center text-sm focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                                onChange={(e) => onUpdate({ posterUrl: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    제목 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="쇼 / 페스티벌 이름"
                />
            </div>

            {/* Date & Venue */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                        날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={component.date}
                        onChange={(e) => onUpdate({ date: e.target.value })}
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                        장소 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={component.venue.name}
                        onChange={(e) =>
                            onUpdate({ venue: { ...component.venue, name: e.target.value } })
                        }
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                        placeholder="클럽, 베뉴 이름"
                    />
                </div>
            </div>

            {/* Lineup Tags */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    라인업
                </label>
                <div className="flex min-h-[48px] flex-wrap gap-2 rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card p-2">
                    {component.lineup.map((performer) => (
                        <span
                            key={performer.id || performer.name}
                            className="inline-flex items-center gap-1 rounded-full bg-dashboard-bg-muted px-3 py-1 text-sm"
                        >
                            {performer.name}
                            <button
                                onClick={() => removeTag(performer)}
                                className="text-dashboard-text-placeholder hover:text-dashboard-text-secondary"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="min-w-[120px] flex-1 border-none bg-transparent px-2 py-1 text-sm focus:outline-none"
                        placeholder={
                            component.lineup.length === 0 ? '@username으로 아티스트 태그' : ''
                        }
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    설명
                </label>
                <textarea
                    value={component.description || ''}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full resize-none rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="쇼에 대한 설명을 입력하세요..."
                    rows={4}
                />
            </div>
        </div>
    );
}
