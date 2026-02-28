'use client';

import { EditableField } from '@/components/ui/editable-field';
import type { EntryEditorProps } from './types';
import { Plus, X } from 'lucide-react';
import { useArrayField } from '../../../hooks/use-array-field';
import ImageEditor from './ImageEditor';

export default function MixsetEditor({
    entry: rawEntry,
    onUpdate,
    editingField,
    onEditingDone,
}: EntryEditorProps) {
    if (rawEntry.type !== 'mixset') return null;
    const entry = rawEntry;
    return (
        <div className="space-y-4">
            {/* Cover */}
            <ImageEditor
                value={entry.coverUrl || ''}
                onSave={(url) => onUpdate({ coverUrl: url })}
                aspectRatio="1/1"
                placeholder="커버 이미지"
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

            {/* URL */}
            <div className="rounded-xl bg-dashboard-bg-muted p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    URL
                </p>
                <EditableField
                    value={entry.url || ''}
                    onSave={(value) => onUpdate({ url: value })}
                    placeholder="Audio or SoundCloud URL"
                    className="text-sm text-dashboard-text-secondary"
                />
            </div>

            {/* Description */}
            <EditableField
                value={entry.description || ''}
                onSave={(value) => onUpdate({ description: value })}
                placeholder="믹스셋에 대한 설명..."
                multiline
                rows={3}
                className="text-sm leading-relaxed text-dashboard-text-muted"
            />

            {/* Tracklist */}
            <TracklistEditor
                tracklist={entry.tracklist}
                onSave={(tracklist) => onUpdate({ tracklist })}
            />
        </div>
    );
}

// ===== Tracklist 에디터 =====
function TracklistEditor({
    tracklist,
    onSave,
}: {
    tracklist: { track: string; artist: string; time: string }[];
    onSave: (tracklist: { track: string; artist: string; time: string }[]) => void;
}) {
    const { add, update, remove, keys } = useArrayField(tracklist, onSave, {
        track: '',
        artist: '',
        time: '0:00',
    });

    return (
        <div className="rounded-xl bg-dashboard-bg-muted p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                Tracklist
            </h3>
            <div className="space-y-2">
                {tracklist.map((track, i) => (
                    <div key={keys[i]} className="flex items-baseline gap-3 text-sm">
                        <EditableField
                            value={track.time}
                            onSave={(value) => update(i, 'time', value)}
                            placeholder="0:00"
                            className="w-12 shrink-0 font-mono text-xs text-dashboard-text-placeholder"
                        />
                        <div className="min-w-0 flex-1">
                            <EditableField
                                value={track.track}
                                onSave={(value) => update(i, 'track', value)}
                                placeholder="트랙 제목"
                                className="text-dashboard-text-secondary"
                            />
                        </div>
                        <EditableField
                            value={track.artist}
                            onSave={(value) => update(i, 'artist', value)}
                            placeholder="아티스트"
                            className="text-dashboard-text-placeholder"
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
                    트랙 추가
                </button>
            </div>
        </div>
    );
}
