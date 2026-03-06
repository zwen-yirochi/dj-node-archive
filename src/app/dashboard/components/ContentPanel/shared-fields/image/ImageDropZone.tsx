'use client';

import { useState } from 'react';

import { ImagePlus, Loader2 } from 'lucide-react';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface ImageDropZoneProps {
    height: number;
    isUploading: boolean;
    disabled?: boolean;
    onFileDrop: (files: File[]) => void;
    onClickAdd: () => void;
    /** true면 w-full, false면 카드 사이즈 (w-28) */
    fullWidth?: boolean;
}

export default function ImageDropZone({
    height,
    isUploading,
    disabled,
    onFileDrop,
    onClickAdd,
    fullWidth,
}: ImageDropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const isDisabled = disabled || isUploading;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isDisabled) return;

        const imageFiles = Array.from(e.dataTransfer.files).filter((f) =>
            ACCEPTED_TYPES.has(f.type)
        );
        if (imageFiles.length > 0) {
            onFileDrop(imageFiles);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDisabled) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    return (
        <button
            type="button"
            onClick={onClickAdd}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={isDisabled}
            style={
                fullWidth
                    ? { height: `${height}px` }
                    : { height: `${height}px`, width: `${height}px` }
            }
            className={`flex ${fullWidth ? 'w-full' : ''} flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors ${
                isDragOver
                    ? 'border-dashboard-accent bg-dashboard-accent/5'
                    : 'border-dashboard-border hover:border-dashboard-border-hover hover:bg-dashboard-bg-muted/30'
            } disabled:cursor-not-allowed disabled:opacity-50`}
        >
            {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-dashboard-text-muted" />
            ) : (
                <>
                    <ImagePlus className="h-5 w-5 text-dashboard-text-placeholder" />
                    <span className="text-[10px] text-dashboard-text-placeholder">Add or drop</span>
                </>
            )}
        </button>
    );
}
