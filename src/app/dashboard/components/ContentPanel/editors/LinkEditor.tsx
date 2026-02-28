'use client';

import { EditableField } from '@/components/ui/editable-field';
import { cn } from '@/lib/utils';
import { ICON_OPTIONS } from '@/types';
import type { EntryEditorProps } from './types';
import { ExternalLink, Globe, Instagram, Mail, Music, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function LinkEditor({
    entry: rawEntry,
    onUpdate,
    editingField,
    onEditingDone,
}: EntryEditorProps) {
    const [showIconSelector, setShowIconSelector] = useState(false);

    // LinkEntry doesn't have images — dismiss image editing immediately
    useEffect(() => {
        if (editingField === 'image') {
            onEditingDone();
        }
    }, [editingField, onEditingDone]);

    if (rawEntry.type !== 'link') return null;
    const entry = rawEntry;
    const IconComponent = iconComponents[entry.icon || ''] || Globe;

    return (
        <div className="space-y-4 py-4 text-center">
            {/* Icon */}
            <div className="relative mx-auto">
                <button
                    onClick={() => setShowIconSelector(!showIconSelector)}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted transition-colors hover:bg-dashboard-bg-hover"
                    title="클릭하여 아이콘 변경"
                >
                    <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
                </button>
                {showIconSelector && (
                    <div className="absolute left-1/2 z-10 mt-2 -translate-x-1/2 rounded-xl border border-dashboard-border bg-dashboard-bg-card p-3 shadow-lg">
                        <div className="grid grid-cols-4 gap-2">
                            {ICON_OPTIONS.map((icon) => {
                                const Icon = iconComponents[icon] || Globe;
                                return (
                                    <button
                                        key={icon}
                                        onClick={() => {
                                            onUpdate({ icon });
                                            setShowIconSelector(false);
                                        }}
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
                                            entry.icon === icon
                                                ? 'border-dashboard-text bg-dashboard-bg-muted'
                                                : 'border-transparent hover:bg-dashboard-bg-hover'
                                        )}
                                        title={icon}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Title */}
            <EditableField
                value={entry.title}
                onSave={(value) => onUpdate({ title: value })}
                placeholder="제목 없음"
                required
                disabled
                forceEdit={editingField === 'title'}
                className="text-xl font-bold text-dashboard-text"
            />

            {/* URL */}
            <div className="inline-flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-dashboard-text-muted" />
                <EditableField
                    value={entry.url}
                    onSave={(value) => onUpdate({ url: value })}
                    placeholder="https://..."
                    required
                    className="text-sm text-dashboard-text-muted"
                />
            </div>
        </div>
    );
}
