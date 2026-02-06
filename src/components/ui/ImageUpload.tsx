'use client';

import { uploadPoster, deletePoster } from '@/app/dashboard/actions/upload';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import { ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    className?: string;
    aspectRatio?: 'square' | 'poster' | 'wide';
}

const aspectRatioClasses = {
    square: 'aspect-square',
    poster: 'aspect-[3/4]',
    wide: 'aspect-video',
};

export default function ImageUpload({
    value,
    onChange,
    className,
    aspectRatio = 'poster',
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsUploading(true);

        try {
            // 이미지 압축 옵션
            const compressionOptions = {
                maxSizeMB: 1, // 최대 1MB
                maxWidthOrHeight: 1200, // 최대 1200px
                useWebWorker: true,
                fileType: 'image/webp' as const, // WebP로 변환
            };

            // 이미지 압축
            const compressedFile = await imageCompression(file, compressionOptions);

            const formData = new FormData();
            formData.append('file', compressedFile);

            const result = await uploadPoster(formData);

            if (result.success && result.data) {
                onChange(result.data.posterUrl);
            } else if (!result.success) {
                setError(result.error);
            }
        } catch {
            setError('An error occurred');
        } finally {
            setIsUploading(false);
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleRemove = async () => {
        if (!value) return;

        setIsUploading(true);
        try {
            // Storage에서 삭제 시도 (실패해도 URL은 지움)
            await deletePoster(value);
            onChange('');
        } catch {
            // 삭제 실패해도 UI에서는 제거
            onChange('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        if (!isUploading && !value) {
            inputRef.current?.click();
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {value ? (
                // Preview with remove button
                <div className="relative w-fit">
                    <div
                        className={cn(
                            'relative overflow-hidden rounded-lg border border-dashboard-border',
                            aspectRatioClasses[aspectRatio],
                            'w-40'
                        )}
                    >
                        <Image
                            src={value}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                            sizes="160px"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isUploading}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 disabled:opacity-50"
                    >
                        {isUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <X className="h-3 w-3" />
                        )}
                    </button>
                </div>
            ) : (
                // Upload button
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isUploading}
                    className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
                        'border-dashboard-border text-dashboard-text-muted',
                        'hover:border-dashboard-border-hover hover:text-dashboard-text-secondary',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        aspectRatioClasses[aspectRatio],
                        'max-h-40'
                    )}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-sm">Upload image</span>
                        </>
                    )}
                </button>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
