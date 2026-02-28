'use client';

import { ExternalLink, Plus, X } from 'lucide-react';

import { EditableField } from '@/components/ui/editable-field';

import { useArrayField } from '../../../../hooks/use-array-field';
import type { FieldBlockProps } from '../types';

export default function LinksBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const isEvent = entry.type === 'event';
    const links = isEvent ? entry.links || [] : [];

    const handleLinksChange = (updatedLinks: { title: string; url: string }[]) => {
        onSave('links', updatedLinks);
    };

    const { add, update, remove, keys } = useArrayField(links, handleLinksChange, {
        title: '',
        url: '',
    });

    if (!isEvent) return null;

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                관련 링크
            </p>
            {links.map((link, i) => (
                <div
                    key={keys[i]}
                    className="flex items-center gap-2 rounded-lg bg-dashboard-bg-muted px-3 py-2"
                >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                    <EditableField
                        value={link.title}
                        onSave={(value) => update(i, 'title', value)}
                        placeholder="링크 제목"
                        disabled={disabled}
                        className="flex-1 text-sm text-dashboard-text-secondary"
                    />
                    <EditableField
                        value={link.url}
                        onSave={(value) => update(i, 'url', value)}
                        placeholder="URL"
                        disabled={disabled}
                        className="flex-1 text-sm text-dashboard-text-muted"
                    />
                    {!disabled && (
                        <button
                            onClick={() => remove(i)}
                            className="p-1 text-dashboard-text-placeholder hover:text-red-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            {!disabled && (
                <button
                    onClick={add}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
                >
                    <Plus className="h-3.5 w-3.5" />
                    링크 추가
                </button>
            )}
        </div>
    );
}
