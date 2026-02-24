'use client';

import { EditableField } from '@/components/ui/editable-field';
import type { MixsetEntry } from '@/types';
import { Plus, X } from 'lucide-react';
import ImageEditor from './ImageEditor';

interface MixsetEditorProps {
    entry: MixsetEntry;
    onUpdate: (updates: Partial<MixsetEntry>) => void;
    editingField: 'title' | 'image' | null;
    onEditingDone: () => void;
}

export default function MixsetEditor({
    entry,
    onUpdate,
    editingField,
    onEditingDone,
}: MixsetEditorProps) {
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

            {/* SoundCloud URL */}
            <div className="rounded-xl bg-dashboard-bg-muted p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    SoundCloud URL
                </p>
                <EditableField
                    value={entry.soundcloudUrl || ''}
                    onSave={(value) => onUpdate({ soundcloudUrl: value })}
                    placeholder="https://soundcloud.com/..."
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
    const addTrack = () => {
        onSave([...tracklist, { track: '', artist: '', time: '0:00' }]);
    };

    const updateTrack = (index: number, field: 'track' | 'artist' | 'time', value: string) => {
        const newTracklist = [...tracklist];
        newTracklist[index] = { ...newTracklist[index], [field]: value };
        onSave(newTracklist);
    };

    const removeTrack = (index: number) => {
        onSave(tracklist.filter((_, i) => i !== index));
    };

    return (
        <div className="rounded-xl bg-dashboard-bg-muted p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                Tracklist
            </h3>
            <div className="space-y-2">
                {tracklist.map((track, i) => (
                    <div key={i} className="flex items-baseline gap-3 text-sm">
                        <EditableField
                            value={track.time}
                            onSave={(value) => updateTrack(i, 'time', value)}
                            placeholder="0:00"
                            className="w-12 shrink-0 font-mono text-xs text-dashboard-text-placeholder"
                        />
                        <div className="min-w-0 flex-1">
                            <EditableField
                                value={track.track}
                                onSave={(value) => updateTrack(i, 'track', value)}
                                placeholder="트랙 제목"
                                className="text-dashboard-text-secondary"
                            />
                        </div>
                        <EditableField
                            value={track.artist}
                            onSave={(value) => updateTrack(i, 'artist', value)}
                            placeholder="아티스트"
                            className="text-dashboard-text-placeholder"
                        />
                        <button
                            onClick={() => removeTrack(i)}
                            className="p-1 text-dashboard-text-placeholder hover:text-red-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addTrack}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
                >
                    <Plus className="h-3.5 w-3.5" />
                    트랙 추가
                </button>
            </div>
        </div>
    );
}
