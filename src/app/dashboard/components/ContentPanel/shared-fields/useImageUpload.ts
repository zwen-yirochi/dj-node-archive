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

    // Refs to avoid stale closures in async callbacks
    const valueRef = useRef(value);
    valueRef.current = value;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const maxCountRef = useRef(maxCount);
    maxCountRef.current = maxCount;

    const canAdd = value.length < maxCount;

    const uploadFiles = useCallback(async (files: File[]) => {
        const remaining = maxCountRef.current - valueRef.current.length;
        if (remaining <= 0) return;

        const toUpload = files.slice(0, remaining);
        setError(null);
        setIsUploading(true);

        const results = await Promise.allSettled(
            toUpload.map(async (file) => {
                const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
                const formData = new FormData();
                formData.append('file', compressed);
                return uploadPoster(formData);
            })
        );

        const newItems: ImageItem[] = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { value } = result;
                if (value.success && value.data) {
                    newItems.push({ id: generateId(), url: value.data.posterUrl });
                } else if (!value.success) {
                    setError(value.error);
                }
            } else {
                setError('Upload failed');
            }
        }

        if (newItems.length > 0) {
            onChangeRef.current([...valueRef.current, ...newItems]);
        }
        setIsUploading(false);
    }, []);

    const replaceFile = useCallback(async (id: string, file: File) => {
        setError(null);
        setIsUploading(true);

        try {
            const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
            const formData = new FormData();
            formData.append('file', compressed);

            const result = await uploadPoster(formData);

            if (result.success && result.data) {
                const newUrl = result.data.posterUrl;
                const old = valueRef.current.find((v) => v.id === id);
                if (old) deletePoster(old.url).catch(() => {});

                onChangeRef.current(
                    valueRef.current.map((v) => (v.id === id ? { ...v, url: newUrl } : v))
                );
            } else if (!result.success) {
                setError(result.error);
            }
        } catch {
            setError('Upload failed');
        } finally {
            setIsUploading(false);
        }
    }, []);

    const removeImage = useCallback(async (id: string) => {
        const item = valueRef.current.find((v) => v.id === id);
        if (!item) return;

        try {
            await deletePoster(item.url);
        } catch {
            // 삭제 실패해도 UI에서는 제거
        }
        onChangeRef.current(valueRef.current.filter((v) => v.id !== id));
    }, []);

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files?.length) return;
            uploadFiles(Array.from(files));
            if (inputRef.current) inputRef.current.value = '';
        },
        [uploadFiles]
    );

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return {
        isUploading,
        error,
        canAdd,
        inputRef,
        uploadFiles,
        replaceFile,
        removeImage,
        handleFileSelect,
        openFilePicker,
    };
}
