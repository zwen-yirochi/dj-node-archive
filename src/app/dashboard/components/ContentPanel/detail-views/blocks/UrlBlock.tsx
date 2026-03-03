'use client';

import { useEffect, useRef, useState } from 'react';

import { Check, Copy, ExternalLink, X } from 'lucide-react';

import type { FieldBlockProps } from '../types';

export default function UrlBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const url = 'url' in entry ? (entry.url as string) || '' : '';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(url);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setEditValue(url);
        }
    }, [url, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed !== url) {
            onSave('url', trimmed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(url);
            setIsEditing(false);
        }
    };

    const handleCopy = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore
        }
    };

    const handleClear = () => {
        onSave('url', '');
        setEditValue('');
    };

    // Input mode — empty state or editing
    if (!url || isEditing) {
        return (
            <div className="flex items-center gap-3 text-sm">
                <ExternalLink className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsEditing(true)}
                    disabled={disabled}
                    placeholder="Paste a URL"
                    className="w-full bg-transparent text-dashboard-text-secondary outline-none placeholder:text-dashboard-text-placeholder"
                />
            </div>
        );
    }

    // Read mode — double-click to edit + copy/remove buttons
    return (
        <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <div
                onDoubleClick={() => !disabled && setIsEditing(true)}
                className="min-w-0 flex-1 cursor-text truncate rounded px-1 text-sm text-dashboard-text-secondary transition-colors hover:bg-dashboard-bg-hover"
                title="Double-click to edit"
            >
                {url}
            </div>
            {!disabled && (
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="rounded p-1.5 text-dashboard-text-placeholder transition-colors hover:bg-dashboard-bg-hover hover:text-dashboard-text-secondary"
                        title="Copy"
                    >
                        {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </button>
                    <button
                        onClick={handleClear}
                        className="rounded p-1.5 text-dashboard-text-placeholder transition-colors hover:bg-dashboard-bg-hover hover:text-dashboard-danger"
                        title="Remove"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
