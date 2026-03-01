'use client';

import { Plus, X } from 'lucide-react';

import { EditableField } from '@/components/ui/editable-field';

import { useArrayField } from '../../../../hooks/use-array-field';
import type { FieldBlockProps } from '../types';

export default function TracklistBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const tracklist = entry.type === 'mixset' ? entry.tracklist || [] : [];

    const handleTracklistChange = (items: { track: string; artist: string; time: string }[]) => {
        onSave('tracklist', items);
    };

    const { add, update, remove, keys } = useArrayField(tracklist, handleTracklistChange, {
        track: '',
        artist: '',
        time: '0:00',
    });

    return (
        <div>
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
                            disabled={disabled}
                            className="w-12 shrink-0 font-mono text-xs text-dashboard-text-placeholder"
                        />
                        <div className="min-w-0 flex-1">
                            <EditableField
                                value={track.track}
                                onSave={(value) => update(i, 'track', value)}
                                placeholder="트랙 제목"
                                disabled={disabled}
                                className="text-dashboard-text-secondary"
                            />
                        </div>
                        <EditableField
                            value={track.artist}
                            onSave={(value) => update(i, 'artist', value)}
                            placeholder="아티스트"
                            disabled={disabled}
                            className="text-dashboard-text-placeholder"
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
                        트랙 추가
                    </button>
                )}
            </div>
        </div>
    );
}
