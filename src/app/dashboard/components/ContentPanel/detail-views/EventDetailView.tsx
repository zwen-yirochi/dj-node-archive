'use client';

import Image from 'next/image';

import { Music } from 'lucide-react';

import { EVENT_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';

import { ImageEditModal, TitleEditModal } from './EditModals';
import type { DetailViewProps } from './types';

// ============================================
// EventDetailView
// ============================================

export default function EventDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const posterUrl = entry.posterUrl;
    const title = entry.title;

    return (
        <div className="space-y-6">
            {/* Header — Read-only image + title */}
            <div className="space-y-3">
                {posterUrl ? (
                    <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-xl">
                        <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="200px"
                        />
                    </div>
                ) : (
                    <div className="mx-auto flex aspect-[3/4] max-w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-dashboard-border">
                        <div className="text-center">
                            <Music className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                            <p className="text-xs text-dashboard-text-muted">
                                Change image from &quot;...&quot; menu
                            </p>
                        </div>
                    </div>
                )}
                <h2 className="text-center text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* Info Grid — date, venue, lineup */}
            <div className="space-y-3 rounded-xl bg-dashboard-bg-muted p-4">
                {EVENT_FIELD_BLOCKS.slice(0, 3).map((block) => (
                    <block.component
                        key={block.key}
                        entry={entry}
                        onSave={onSave}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Content blocks — description, links */}
            {EVENT_FIELD_BLOCKS.slice(3).map((block) => (
                <block.component
                    key={block.key}
                    entry={entry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}

            {/* Edit Modals — Triggered from "..." menu */}
            {editingField === 'image' && (
                <ImageEditModal
                    value={posterUrl || ''}
                    onSave={(url) => {
                        onSave('posterUrl', url);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
            {editingField === 'title' && (
                <TitleEditModal
                    value={title}
                    onSave={(newTitle) => {
                        onSave('title', newTitle);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
        </div>
    );
}
