'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Check, Copy, ExternalLink, X } from 'lucide-react';

import type { FieldComponentProps } from './types';

interface LinkFieldProps extends FieldComponentProps<string> {
    placeholder?: string;
}

export default function LinkField({
    value,
    onChange,
    disabled,
    placeholder = 'Paste a URL',
}: LinkFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const copiedTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isEditing) {
            setEditValue(value);
        }
    }, [value, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed !== value) {
            onChange(trimmed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        };
    }, []);

    const handleCopy = useCallback(async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(() => {
                copiedTimerRef.current = null;
                setCopied(false);
            }, 1500);
        } catch {
            // ignore
        }
    }, [value]);

    const handleClear = () => {
        onChange('');
        setEditValue('');
    };

    // Input mode — empty state or editing
    if (!value || isEditing) {
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
                    placeholder={placeholder}
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
                {value}
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
