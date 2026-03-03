'use client';

import Image from 'next/image';

import { ImagePlus } from 'lucide-react';

import { MIXSET_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';

import { ImageEditModal, TitleEditModal } from './EditModals';
import type { DetailViewProps } from './types';

export default function MixsetDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'mixset') return null;

    const coverUrl = entry.coverUrl;
    const title = entry.title;

    const blockByKey = Object.fromEntries(MIXSET_FIELD_BLOCKS.map((b) => [b.key, b.component]));
    const UrlComponent = blockByKey.url;
    const DescComponent = blockByKey.description;
    const TracklistComponent = blockByKey.tracklist;

    return (
        <div className="space-y-8">
            {/* Header — Read-only cover + title */}
            <div className="space-y-3">
                {coverUrl ? (
                    <div className="relative mx-auto aspect-square max-w-[200px] overflow-hidden rounded-xl">
                        <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="200px"
                        />
                    </div>
                ) : (
                    <div className="mx-auto flex aspect-square max-w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-dashboard-border">
                        <div className="text-center">
                            <ImagePlus className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                            <p className="text-xs text-dashboard-text-muted">
                                Change image from &quot;...&quot; menu
                            </p>
                        </div>
                    </div>
                )}
                <h2 className="text-center text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* URL block */}
            <div>
                <UrlComponent entry={entry} onSave={onSave} disabled={disabled} />
            </div>

            {/* Description block */}
            <DescComponent entry={entry} onSave={onSave} disabled={disabled} />

            {/* Tracklist block */}
            <div>
                <TracklistComponent entry={entry} onSave={onSave} disabled={disabled} />
            </div>

            {/* Edit Modals */}
            {editingField === 'image' && (
                <ImageEditModal
                    value={coverUrl || ''}
                    onSave={(url) => {
                        onSave('coverUrl', url);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                    aspectRatio="1/1"
                    title="Change cover image"
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
