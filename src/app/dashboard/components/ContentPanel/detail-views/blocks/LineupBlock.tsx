'use client';

import { useState } from 'react';

import { Users, X } from 'lucide-react';

import type { ArtistReference } from '@/types';

import type { FieldBlockProps } from '../types';

export default function LineupBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const isEvent = entry.type === 'event';
    const lineup: ArtistReference[] = isEvent ? entry.lineup : [];

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    if (!isEvent) return null;

    const addPerformer = (name: string) => {
        const formattedName = name.startsWith('@') ? name : `@${name}`;
        if (!lineup.some((p) => p.name === formattedName)) {
            onSave('lineup', [...lineup, { name: formattedName }]);
        }
        setInputValue('');
    };

    const removePerformer = (performer: ArtistReference) => {
        onSave(
            'lineup',
            lineup.filter((p) => p.name !== performer.name)
        );
    };

    if (isEditing) {
        return (
            <div className="flex items-start gap-3 text-sm">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                <div className="flex flex-1 flex-wrap gap-1">
                    {lineup.map((performer) => (
                        <span
                            key={performer.id || performer.name}
                            className="inline-flex items-center gap-1 rounded-full bg-dashboard-bg-card px-2 py-0.5 text-xs"
                        >
                            {performer.name}
                            {!disabled && (
                                <button
                                    onClick={() => removePerformer(performer)}
                                    className="text-dashboard-text-placeholder hover:text-dashboard-danger"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
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
                            } else if (
                                e.key === 'Backspace' &&
                                inputValue === '' &&
                                lineup.length > 0
                            ) {
                                removePerformer(lineup[lineup.length - 1]);
                            }
                        }}
                        onBlur={() => {
                            if (inputValue.trim()) {
                                addPerformer(inputValue.trim());
                            }
                            setIsEditing(false);
                        }}
                        className="min-w-[80px] flex-1 border-none bg-transparent text-sm focus:outline-none"
                        placeholder="Tag artists with @username"
                        autoFocus
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 text-sm">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <div
                className={`flex-1 ${disabled ? '' : 'cursor-pointer'}`}
                onDoubleClick={() => !disabled && setIsEditing(true)}
                title={disabled ? undefined : 'Double-click to edit'}
            >
                {lineup.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {lineup.map((performer) => (
                            <span
                                key={performer.id || performer.name}
                                className="text-dashboard-text-secondary"
                            >
                                {performer.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-dashboard-text-placeholder">
                        Tag artists with @username
                    </span>
                )}
            </div>
        </div>
    );
}
