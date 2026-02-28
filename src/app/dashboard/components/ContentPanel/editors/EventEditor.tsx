'use client';

import { EditableDateField, EditableField } from '@/components/ui/editable-field';
import type { EntryEditorProps } from './types';
import { Calendar, ExternalLink, MapPin, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useArrayField } from '../../../hooks/use-array-field';
import ImageEditor from './ImageEditor';

export default function EventEditor({
    entry: rawEntry,
    onUpdate,
    editingField,
    onEditingDone,
}: EntryEditorProps) {
    if (rawEntry.type !== 'event') return null;
    const entry = rawEntry;
    return (
        <div className="space-y-4">
            {/* Poster */}
            <ImageEditor
                value={entry.posterUrl || ''}
                onSave={(url) => onUpdate({ posterUrl: url })}
                aspectRatio="3/4"
                placeholder="포스터 이미지"
                forceEdit={editingField === 'image'}
                onEditingDone={onEditingDone}
            />

            {/* Title */}
            <EditableField
                value={entry.title}
                onSave={(value) => onUpdate({ title: value })}
                placeholder="제목 없음"
                required
                disabled
                forceEdit={editingField === 'title'}
                className="text-center text-xl font-bold text-dashboard-text"
            />

            {/* Info Grid */}
            <div className="space-y-3 rounded-xl bg-dashboard-bg-muted p-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditableDateField
                        value={entry.date}
                        onSave={(value) => onUpdate({ date: value })}
                        required
                        className="text-dashboard-text-secondary"
                    />
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditableField
                        value={entry.venue.name}
                        onSave={(value) => onUpdate({ venue: { ...entry.venue, name: value } })}
                        placeholder="장소를 입력하세요"
                        required
                        className="flex-1 text-dashboard-text-secondary"
                    />
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditablePerformersField
                        value={entry.lineup}
                        onSave={(value) => onUpdate({ lineup: value })}
                        placeholder="@username으로 아티스트 태그"
                        className="flex-1"
                    />
                </div>
            </div>

            {/* Description */}
            <EditableField
                value={entry.description || ''}
                onSave={(value) => onUpdate({ description: value })}
                placeholder="쇼에 대한 설명을 입력하세요..."
                multiline
                rows={4}
                className="text-sm leading-relaxed text-dashboard-text-muted"
            />

            {/* Links */}
            <LinksEditor links={entry.links || []} onSave={(links) => onUpdate({ links })} />
        </div>
    );
}

// ===== Performers 필드 에디터 (lineup용) =====
function EditablePerformersField({
    value,
    onSave,
    placeholder,
    className,
}: {
    value: { id?: string; name: string }[];
    onSave: (value: { id?: string; name: string }[]) => void;
    placeholder?: string;
    className?: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const addPerformer = (name: string) => {
        const formattedName = name.startsWith('@') ? name : `@${name}`;
        if (!value.some((p) => p.name === formattedName)) {
            onSave([...value, { name: formattedName }]);
        }
        setInputValue('');
    };

    const removePerformer = (performer: { id?: string; name: string }) => {
        onSave(value.filter((p) => p.name !== performer.name));
    };

    if (isEditing) {
        return (
            <div className={`flex flex-wrap gap-1 ${className ?? ''}`}>
                {value.map((performer) => (
                    <span
                        key={performer.id || performer.name}
                        className="inline-flex items-center gap-1 rounded-full bg-dashboard-bg-card px-2 py-0.5 text-xs"
                    >
                        {performer.name}
                        <button
                            onClick={() => removePerformer(performer)}
                            className="text-dashboard-text-placeholder hover:text-red-500"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputValue.trim()) {
                            e.preventDefault();
                            addPerformer(inputValue.trim());
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
                            removePerformer(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => {
                        if (inputValue.trim()) {
                            addPerformer(inputValue.trim());
                        }
                        setIsEditing(false);
                    }}
                    className="min-w-[80px] flex-1 border-none bg-transparent text-sm focus:outline-none"
                    placeholder={placeholder}
                    autoFocus
                />
            </div>
        );
    }

    return (
        <div
            className={`cursor-pointer ${className ?? ''}`}
            onDoubleClick={() => setIsEditing(true)}
        >
            {value.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {value.map((performer) => (
                        <span
                            key={performer.id || performer.name}
                            className="text-dashboard-text-secondary"
                        >
                            {performer.name}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="text-dashboard-text-placeholder">{placeholder}</span>
            )}
        </div>
    );
}

// ===== Links 에디터 =====
function LinksEditor({
    links,
    onSave,
}: {
    links: { title: string; url: string }[];
    onSave: (links: { title: string; url: string }[]) => void;
}) {
    const { add, update, remove, keys } = useArrayField(links, onSave, { title: '', url: '' });

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
                        className="flex-1 text-sm text-dashboard-text-secondary"
                    />
                    <EditableField
                        value={link.url}
                        onSave={(value) => update(i, 'url', value)}
                        placeholder="URL"
                        className="flex-1 text-sm text-dashboard-text-muted"
                    />
                    <button
                        onClick={() => remove(i)}
                        className="p-1 text-dashboard-text-placeholder hover:text-red-500"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={add}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
            >
                <Plus className="h-3.5 w-3.5" />
                링크 추가
            </button>
        </div>
    );
}
