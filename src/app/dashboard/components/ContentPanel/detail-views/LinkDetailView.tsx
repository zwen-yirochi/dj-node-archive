'use client';

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

export default function LinkDetailView({ entry, onSave, disabled }: LinkDetailViewProps) {
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
                    <div className="min-w-0 flex-1">
                        <SyncedField
                            config={URL_FIELD_CONFIG}
                            value={entry.url || ''}
                            onSave={(v) => onSave('url', v)}
                        >
                            <LinkField disabled={disabled} />
                        </SyncedField>
                    </div>
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
