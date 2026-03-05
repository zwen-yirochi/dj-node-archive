'use client';

import imageCompression from 'browser-image-compression';
import { useCallback, useRef, useState } from 'react';

import { deletePoster, uploadPoster } from '@/app/dashboard/actions/upload';

import type { ImageItem } from './types';

const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
};

function generateId() {
    return `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface UseImageUploadOptions {
    value: ImageItem[];
    onChange: (items: ImageItem[]) => void;
    maxCount: number;
}

export function useImageUpload({ value, onChange, maxCount }: UseImageUploadOptions) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const canAdd = value.length < maxCount;

    const uploadFile = useCallback(
        async (file: File) => {
            if (!canAdd) return;
            setError(null);
            setIsUploading(true);

            try {
                const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
                const formData = new FormData();
                formData.append('file', compressed);

                const result = await uploadPoster(formData);

                if (result.success && result.data) {
                    const newItem: ImageItem = { id: generateId(), url: result.data.posterUrl };
                    onChange([...value, newItem]);
                } else if (!result.success) {
                    setError(result.error);
                }
            } catch {
                setError('Upload failed');
            } finally {
                setIsUploading(false);
            }
        },
        [canAdd, onChange, value]
    );

    const replaceFile = useCallback(
        async (id: string, file: File) => {
            setError(null);
            setIsUploading(true);

            try {
                const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
                const formData = new FormData();
                formData.append('file', compressed);

                const result = await uploadPoster(formData);

                if (result.success && result.data) {
                    // 기존 이미지 스토리지 삭제 (비동기, 실패 무시)
                    const old = value.find((v) => v.id === id);
                    if (old) deletePoster(old.url).catch(() => {});

                    onChange(
                        value.map((v) => (v.id === id ? { ...v, url: result.data!.posterUrl } : v))
                    );
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

    const removeImage = useCallback(
        async (id: string) => {
            const item = value.find((v) => v.id === id);
            if (!item) return;

            try {
                await deletePoster(item.url);
            } catch {
                // 삭제 실패해도 UI에서는 제거
            }
            onChange(value.filter((v) => v.id !== id));
        },
        [onChange, value]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            if (inputRef.current) inputRef.current.value = '';
        },
        [uploadFile]
    );

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return {
        isUploading,
        error,
        canAdd,
        inputRef,
        uploadFile,
        replaceFile,
        removeImage,
        handleFileSelect,
        openFilePicker,
    };
}
