'use client';

import { Users } from 'lucide-react';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import TagListField, { type TagItem } from '../../shared-fields/TagListField';
import type { FieldBlockProps } from '../types';

const LINEUP_CONFIG: FieldSyncConfig<TagItem[]> = { immediate: true };

const formatArtistTag = (name: string) => (name.startsWith('@') ? name : `@${name}`);

export default function LineupBlock({ entry, onSave, disabled }: FieldBlockProps) {
    if (entry.type !== 'event') return null;

    const lineup = entry.lineup;

    return (
        <div className="flex items-start gap-3 text-sm">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <FieldSync
                config={LINEUP_CONFIG}
                value={lineup as TagItem[]}
                onSave={(items) => onSave('lineup', items)}
            >
                {({ value, onChange }) => (
                    <TagListField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder="Tag artists with @username"
                        formatNewTag={formatArtistTag}
                    />
                )}
            </FieldSync>
        </div>
    );
}
