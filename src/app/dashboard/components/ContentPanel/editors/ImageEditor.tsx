'use client';

import { cn } from '@/lib/utils';
import { Music, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
    value: string;
    onSave: (url: string) => void;
    aspectRatio: '3/4' | '1/1';
    placeholder: string;
    forceEdit?: boolean;
    onEditingDone?: () => void;
}

export default function ImageEditor({
    value,
    onSave,
    aspectRatio,
    placeholder,
    forceEdit = false,
    onEditingDone,
}: ImageEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // forceEdit가 true로 바뀌면 편집 모드 진입
    useEffect(() => {
        if (forceEdit && !isEditing) {
            setIsEditing(true);
        }
    }, [forceEdit, isEditing]);

    const finishEditing = () => {
        setIsEditing(false);
        setInputValue('');
        onEditingDone?.();
    };

    if (value) {
        return (
            <div
                className={cn(
                    'relative mx-auto overflow-hidden rounded-xl',
                    aspectRatio === '3/4'
                        ? 'aspect-[3/4] max-w-[200px]'
                        : 'aspect-square max-w-[200px]'
                )}
            >
                <Image src={value} alt={placeholder} fill className="object-cover" />
                <button
                    onClick={() => onSave('')}
                    className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'mx-auto rounded-xl border-2 border-dashed border-dashboard-border p-4 text-center',
                aspectRatio === '3/4' ? 'aspect-[3/4] max-w-[200px]' : 'aspect-square max-w-[200px]'
            )}
        >
            <div className="flex h-full flex-col items-center justify-center">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => {
                            if (inputValue.trim()) {
                                onSave(inputValue.trim());
                            }
                            finishEditing();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && inputValue.trim()) {
                                onSave(inputValue.trim());
                                finishEditing();
                            } else if (e.key === 'Escape') {
                                finishEditing();
                            }
                        }}
                        placeholder="이미지 URL 입력"
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-center text-sm focus:border-dashboard-text focus:outline-none"
                    />
                ) : (
                    <>
                        <Music className="mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                        <p className="text-xs text-dashboard-text-muted">
                            &quot;...&quot; 메뉴에서 이미지 변경
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
