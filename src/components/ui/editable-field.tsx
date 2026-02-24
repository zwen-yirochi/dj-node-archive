'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
    value: string;
    onSave: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    displayClassName?: string;
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    required?: boolean;
    forceEdit?: boolean;
}

/**
 * 노션 스타일 인라인 편집 필드 컴포넌트
 *
 * - 더블클릭으로 편집 모드 진입
 * - Enter (한 줄) 또는 Escape로 편집 완료/취소
 * - 포커스 아웃 시 자동 저장
 *
 * @example
 * ```tsx
 * <EditableField
 *   value={title}
 *   onSave={(newTitle) => updateComponent({ title: newTitle })}
 *   placeholder="제목 없음"
 *   className="text-xl font-bold"
 * />
 * ```
 */
export function EditableField({
    value,
    onSave,
    placeholder = '클릭하여 편집',
    className,
    inputClassName,
    displayClassName,
    multiline = false,
    rows = 3,
    disabled = false,
    required = false,
    forceEdit = false,
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    // 외부 value가 변경되면 editValue도 업데이트
    React.useEffect(() => {
        if (!isEditing) {
            setEditValue(value);
        }
    }, [value, isEditing]);

    // forceEdit가 true로 바뀌면 편집 모드 진입
    React.useEffect(() => {
        if (forceEdit && !isEditing) {
            setEditValue(value);
            setIsEditing(true);
        }
    }, [forceEdit, isEditing, value]);

    // 편집 모드 진입 시 포커스
    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (disabled) return;
        setEditValue(value);
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmedValue = editValue.trim();

        // required인 경우 빈 값이면 원래 값으로 복원
        if (required && !trimmedValue) {
            setEditValue(value);
            setIsEditing(false);
            return;
        }

        // 값이 변경된 경우에만 저장
        if (trimmedValue !== value) {
            onSave(trimmedValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleBlur = () => {
        handleSave();
    };

    // 편집 모드
    if (isEditing) {
        const baseInputClass = cn(
            'w-full bg-transparent outline-none',
            'border-b-2 border-dashboard-text focus:border-dashboard-text',
            'transition-colors',
            className,
            inputClassName
        );

        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={rows}
                    className={cn(baseInputClass, 'resize-none')}
                />
            );
        }

        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={baseInputClass}
            />
        );
    }

    // 읽기 모드
    const isEmpty = !value || value.trim() === '';

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={cn(
                '-mx-1 cursor-text rounded px-1',
                'transition-colors hover:bg-dashboard-bg-hover',
                disabled && 'cursor-default hover:bg-transparent',
                className,
                displayClassName
            )}
            title={disabled ? undefined : '더블클릭하여 편집'}
        >
            {isEmpty ? (
                <span className="italic text-dashboard-text-placeholder">{placeholder}</span>
            ) : (
                <span className={multiline ? 'whitespace-pre-wrap' : undefined}>{value}</span>
            )}
        </div>
    );
}

interface EditableDateFieldProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

/**
 * 날짜 전용 인라인 편집 필드
 */
export function EditableDateField({
    value,
    onSave,
    className,
    disabled = false,
    required = false,
}: EditableDateFieldProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!isEditing) {
            setEditValue(value);
        }
    }, [value, isEditing]);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (disabled) return;
        setEditValue(value);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (required && !editValue) {
            setEditValue(value);
            setIsEditing(false);
            return;
        }

        if (editValue !== value) {
            onSave(editValue);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        } else if (e.key === 'Enter') {
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn(
                    'bg-transparent outline-none',
                    'border-b-2 border-dashboard-text',
                    className
                )}
            />
        );
    }

    // 날짜 포맷팅 (YYYY-MM-DD -> 읽기 쉬운 형식)
    const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const displayValue = formatDate(value);

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={cn(
                '-mx-1 cursor-text rounded px-1',
                'transition-colors hover:bg-dashboard-bg-hover',
                disabled && 'cursor-default hover:bg-transparent',
                className
            )}
            title={disabled ? undefined : '더블클릭하여 편집'}
        >
            {displayValue || (
                <span className="italic text-dashboard-text-placeholder">날짜 선택</span>
            )}
        </div>
    );
}

interface EditableTagsFieldProps {
    value: string[];
    onSave: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    tagPrefix?: string;
}

/**
 * 태그 전용 인라인 편집 필드
 */
export function EditableTagsField({
    value,
    onSave,
    placeholder = '태그 추가',
    className,
    disabled = false,
    tagPrefix = '@',
}: EditableTagsFieldProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (disabled) return;
        setIsEditing(true);
    };

    const handleAddTag = (tag: string) => {
        const formattedTag = tag.startsWith(tagPrefix) ? tag : `${tagPrefix}${tag}`;
        if (!value.includes(formattedTag)) {
            onSave([...value, formattedTag]);
        }
        setInputValue('');
    };

    const handleRemoveTag = (tag: string) => {
        onSave(value.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            handleAddTag(inputValue.trim());
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            handleRemoveTag(value[value.length - 1]);
        } else if (e.key === 'Escape') {
            setInputValue('');
            setIsEditing(false);
        }
    };

    const handleBlur = () => {
        if (inputValue.trim()) {
            handleAddTag(inputValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={cn(
                '-mx-1 flex min-h-[32px] flex-wrap gap-1.5 rounded px-1',
                'transition-colors',
                !disabled && 'cursor-text hover:bg-dashboard-bg-hover',
                isEditing && 'bg-dashboard-bg-hover',
                className
            )}
            title={disabled ? undefined : '더블클릭하여 편집'}
        >
            {value.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-dashboard-bg-muted px-2.5 py-0.5 text-sm"
                >
                    {tag}
                    {!disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag);
                            }}
                            className="text-dashboard-text-placeholder hover:text-dashboard-text-secondary"
                        >
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </span>
            ))}
            {isEditing && (
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="min-w-[80px] flex-1 bg-transparent text-sm outline-none"
                />
            )}
            {!isEditing && value.length === 0 && (
                <span className="text-sm italic text-dashboard-text-placeholder">
                    {placeholder}
                </span>
            )}
        </div>
    );
}
