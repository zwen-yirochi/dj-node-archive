'use client';

import { useCallback, useState } from 'react';

import { Loader2 } from 'lucide-react';

import {
    ICON_FIELD_CONFIG,
    IconField,
    LinkField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { LinkDetailViewProps } from './types';

async function fetchOgData(url: string) {
    try {
        const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data as {
            title: string | null;
            description: string | null;
            imageUrl: string | null;
        } | null;
    } catch {
        return null;
    }
}

export default function LinkDetailView({ entry, onSave, disabled }: LinkDetailViewProps) {
    const [isFetchingOg, setIsFetchingOg] = useState(false);

    const handleUrlSave = useCallback(
        async (newUrl: unknown) => {
            onSave('url', newUrl);

            if (typeof newUrl !== 'string' || !newUrl) return;

            try {
                new URL(newUrl);
            } catch {
                return;
            }

            setIsFetchingOg(true);
            const og = await fetchOgData(newUrl);
            setIsFetchingOg(false);

            if (!og?.imageUrl) return;

            onSave('imageUrls', [og.imageUrl]);
        },
        [onSave]
    );

    return (
        <div className="space-y-8 px-6">
            <div className="flex items-center gap-3">
                <SyncedField
                    config={ICON_FIELD_CONFIG}
                    value={entry.icon || ''}
                    onSave={(v) => onSave('icon', v)}
                >
                    <IconField disabled={disabled} />
                </SyncedField>

                <div className="min-w-0 flex-1">
                    <SyncedField
                        config={TEXT_FIELD_CONFIG}
                        value={entry.title}
                        onSave={(v) => onSave('title', v)}
                    >
                        <TextField
                            disabled={disabled}
                            placeholder="Link title"
                            className="text-xl font-bold text-dashboard-text"
                        />
                    </SyncedField>
                </div>
            </div>

            <div className="mx-4 space-y-4">
                <div className="flex items-center gap-3">
                    <p className="w-16 shrink-0 text-sm font-semibold text-dashboard-text">URL</p>
                    {entry.imageUrls[0] && (
                        <img
                            src={entry.imageUrls[0]}
                            alt=""
                            className="h-7 w-10 flex-shrink-0 rounded border border-dashboard-border object-cover"
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={URL_FIELD_CONFIG}
                            value={entry.url || ''}
                            onSave={handleUrlSave}
                        >
                            <LinkField disabled={disabled} />
                        </SyncedField>
                    </div>
                    {isFetchingOg && (
                        <Loader2 className="h-4 w-4 animate-spin text-dashboard-text-placeholder" />
                    )}
                </div>

                <div className="pt-8">
                    <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                    <SyncedField
                        config={TEXT_FIELD_CONFIG}
                        value={entry.description || ''}
                        onSave={(v) => onSave('description', v)}
                    >
                        <TextField
                            disabled={disabled}
                            variant="textarea"
                            placeholder="Add a description..."
                            className="text-sm leading-relaxed text-dashboard-text-muted"
                        />
                    </SyncedField>
                </div>
            </div>
        </div>
    );
}
