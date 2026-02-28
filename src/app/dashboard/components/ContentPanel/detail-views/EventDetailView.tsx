'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

import { Music } from 'lucide-react';

import { EVENT_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import type { DetailViewProps } from './types';

// ============================================
// Edit Modals
// ============================================

function ImageEditModal({
    value,
    onSave,
    onClose,
}: {
    value: string;
    onSave: (url: string) => void;
    onClose: () => void;
}) {
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave(inputValue.trim());
        onClose();
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-dashboard-border bg-dashboard-bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">포스터 이미지 변경</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        이미지 URL을 입력하세요
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {inputValue && (
                        <div className="relative mx-auto aspect-[3/4] max-w-[160px] overflow-hidden rounded-lg">
                            <Image
                                src={inputValue}
                                alt="미리보기"
                                fill
                                className="object-cover"
                                sizes="160px"
                            />
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-text focus:border-dashboard-text focus:outline-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        {value && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onSave('');
                                    onClose();
                                }}
                                className="text-red-500 hover:text-red-400"
                            >
                                이미지 제거
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-dashboard-text-muted"
                        >
                            취소
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-dashboard-text text-dashboard-bg hover:bg-dashboard-text/90"
                        >
                            저장
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TitleEditModal({
    value,
    onSave,
    onClose,
}: {
    value: string;
    onSave: (title: string) => void;
    onClose: () => void;
}) {
    const [inputValue, setInputValue] = useState(value);

    const handleSave = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            onSave(trimmed);
            onClose();
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-dashboard-border bg-dashboard-bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">제목 변경</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        새 제목을 입력하세요
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        placeholder="제목"
                        className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-text focus:border-dashboard-text focus:outline-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-dashboard-text-muted"
                        >
                            취소
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!inputValue.trim()}
                            className="bg-dashboard-text text-dashboard-bg hover:bg-dashboard-text/90"
                        >
                            저장
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// EventDetailView
// ============================================

export default function EventDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const posterUrl = entry.posterUrl;
    const title = entry.title;

    return (
        <div className="space-y-6">
            {/* Header — 읽기 전용 이미지 + 제목 */}
            <div className="space-y-3">
                {posterUrl ? (
                    <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-xl">
                        <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="200px"
                        />
                    </div>
                ) : (
                    <div className="mx-auto flex aspect-[3/4] max-w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-dashboard-border">
                        <div className="text-center">
                            <Music className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                            <p className="text-xs text-dashboard-text-muted">
                                &quot;...&quot; 메뉴에서 이미지 변경
                            </p>
                        </div>
                    </div>
                )}
                <h2 className="text-center text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* Info Grid — date, venue, lineup */}
            <div className="space-y-3 rounded-xl bg-dashboard-bg-muted p-4">
                {EVENT_FIELD_BLOCKS.slice(0, 3).map((block) => (
                    <block.component
                        key={block.key}
                        entry={entry}
                        onSave={onSave}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Content blocks — description, links */}
            {EVENT_FIELD_BLOCKS.slice(3).map((block) => (
                <block.component
                    key={block.key}
                    entry={entry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}

            {/* Edit Modals — "..." 메뉴에서 트리거 */}
            {editingField === 'image' && (
                <ImageEditModal
                    value={posterUrl || ''}
                    onSave={(url) => {
                        onSave('posterUrl', url);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
            {editingField === 'title' && (
                <TitleEditModal
                    value={title}
                    onSave={(newTitle) => {
                        onSave('title', newTitle);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
        </div>
    );
}
