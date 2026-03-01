'use client';

import imageCompression from 'browser-image-compression';
import { useRef, useState } from 'react';
import Image from 'next/image';

import { ImagePlus, Loader2 } from 'lucide-react';

import { uploadPoster } from '@/app/dashboard/actions/upload';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// ============================================
// ImageEditModal — Event(poster) + Mixset(cover) 공용
// ============================================

export function ImageEditModal({
    value,
    onSave,
    onClose,
    aspectRatio = '3/4',
    title = '포스터 이미지 변경',
}: {
    value: string;
    onSave: (url: string) => void;
    onClose: () => void;
    aspectRatio?: '3/4' | '1/1';
    title?: string;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsUploading(true);

        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                fileType: 'image/webp' as const,
            });

            const formData = new FormData();
            formData.append('file', compressed);

            const result = await uploadPoster(formData);

            if (result.success && result.data) {
                onSave(result.data.posterUrl);
                onClose();
            } else if (!result.success) {
                setError(result.error);
            }
        } catch {
            setError('업로드 중 오류가 발생했습니다');
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-dashboard-border bg-dashboard-bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">{title}</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        이미지를 업로드하세요
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {value && (
                        <div
                            className="relative mx-auto max-w-[160px] overflow-hidden rounded-lg"
                            style={{ aspectRatio }}
                        >
                            <Image
                                src={value}
                                alt="현재 이미지"
                                fill
                                className="object-cover"
                                sizes="160px"
                            />
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={isUploading}
                            className="border-dashboard-border text-dashboard-text-secondary hover:bg-dashboard-bg-muted"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    업로드 중...
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    이미지 선택
                                </>
                            )}
                        </Button>
                    </div>
                    {error && <p className="text-center text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={isUploading}
                            className="text-dashboard-text-muted"
                        >
                            취소
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// TitleEditModal — Event + Mixset + Link 공용
// ============================================

export function TitleEditModal({
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
