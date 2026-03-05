'use client';

import imageCompression from 'browser-image-compression';
import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';

import { ImagePlus, Loader2, X } from 'lucide-react';

import { deletePoster, uploadPoster } from '@/app/dashboard/actions/upload';

import type { ImageFieldProps } from './types';

const ASPECT_RATIO_CLASS: Record<string, string> = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
};

export default function ImageField({
    value,
    onChange,
    disabled,
    aspectRatio = 'video',
    placeholder,
}: ImageFieldProps) {
    const ratioClass = ASPECT_RATIO_CLASS[aspectRatio] ?? 'aspect-video';
    const PlaceholderIcon = placeholder?.icon ?? ImagePlus;
    const placeholderText = placeholder?.text ?? 'Click or drag to upload';

    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFile = useCallback(
        async (file: File) => {
            setError(null);
            setIsUploading(true);

            try {
                const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
                const formData = new FormData();
                formData.append('file', compressed);

                const result = await uploadPoster(formData);

                if (result.success && result.data) {
                    onChange({ ...value, url: result.data.posterUrl });
                } else if (!result.success) {
                    setError(result.error);
                }
            } catch {
                setError('Upload failed');
            } finally {
                setIsUploading(false);
            }
        },
        [onChange, value]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleRemove = async () => {
        if (!value.url) return;
        setIsUploading(true);
        try {
            await deletePoster(value.url);
        } catch {
            // 삭제 실패해도 UI에서는 제거
        } finally {
            onChange({ ...value, url: '' });
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled || isUploading) return;

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled && !isUploading) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    return (
        <div className="space-y-1">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {value.url ? (
                /* Preview with remove button */
                <div className="group relative">
                    <div
                        className={`relative ${ratioClass} w-full overflow-hidden rounded-lg border border-dashboard-border`}
                    >
                        <Image
                            src={value.url}
                            alt={value.alt || ''}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                        />
                    </div>
                    {/* Hover overlay — replace + remove */}
                    {!disabled && (
                        <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={isUploading}
                                className="rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-white"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-dashboard-text" />
                                ) : (
                                    <ImagePlus className="h-4 w-4 text-dashboard-text" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={isUploading}
                                className="rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-red-50"
                            >
                                <X className="h-4 w-4 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* Upload drop zone */
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    disabled={disabled || isUploading}
                    className={`flex ${ratioClass} w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                        isDragOver
                            ? 'border-dashboard-accent bg-dashboard-accent/5'
                            : 'border-dashboard-border hover:border-dashboard-border-hover'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                    <div className="text-center">
                        {isUploading ? (
                            <>
                                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-dashboard-text-muted" />
                                <p className="text-xs text-dashboard-text-muted">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <PlaceholderIcon className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                                <p className="text-xs text-dashboard-text-muted">
                                    {placeholderText}
                                </p>
                            </>
                        )}
                    </div>
                </button>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
