'use client';

import { useState } from 'react';

import { X } from 'lucide-react';

import type { FieldComponentProps } from './types';

export interface TagItem {
    id?: string;
    name: string;
}

interface TagListFieldProps extends FieldComponentProps<TagItem[]> {
    placeholder?: string;
    /** 새 태그 추가 시 이름 변환 (e.g., @ prefix) */
    formatNewTag?: (name: string) => string;
}

export default function TagListField({
    value,
    onChange,
    disabled,
    placeholder = 'Add tag...',
    formatNewTag,
}: TagListFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const addTag = (name: string) => {
        const formatted = formatNewTag ? formatNewTag(name) : name;
        if (!value.some((t) => t.name === formatted)) {
            onChange([...value, { name: formatted }]);
        }
        setInputValue('');
    };

    const removeTag = (tag: TagItem) => {
        onChange(value.filter((t) => t.name !== tag.name));
    };

    if (isEditing) {
        return (
            <div className="flex flex-1 flex-wrap gap-1">
                {value.map((tag) => (
                    <span
                        key={tag.id || tag.name}
                        className="inline-flex items-center gap-1 rounded-full bg-dashboard-bg-card px-2 py-0.5 text-xs"
                    >
                        {tag.name}
                        {!disabled && (
                            <button
                                onClick={() => removeTag(tag)}
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
                            addTag(inputValue.trim());
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
                            removeTag(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => {
                        if (inputValue.trim()) {
                            addTag(inputValue.trim());
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
            className={`flex-1 ${disabled ? '' : 'cursor-pointer'}`}
            onClick={() => !disabled && setIsEditing(true)}
            title={disabled ? undefined : 'Click to edit'}
        >
            {value.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {value.map((tag) => (
                        <span key={tag.id || tag.name} className="text-dashboard-text-secondary">
                            {tag.name}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="text-dashboard-text-placeholder">{placeholder}</span>
            )}
        </div>
    );
}
