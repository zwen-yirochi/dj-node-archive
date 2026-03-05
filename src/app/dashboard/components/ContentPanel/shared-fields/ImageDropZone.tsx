'use client';

import { useState } from 'react';

import { ImagePlus, Loader2 } from 'lucide-react';

interface ImageDropZoneProps {
    ratioClass: string;
    isUploading: boolean;
    onFileDrop: (file: File) => void;
    onClickAdd: () => void;
    /** true면 w-full, false면 카드 사이즈 (w-28/sm:w-32) */
    fullWidth?: boolean;
}

export default function ImageDropZone({
    ratioClass,
    isUploading,
    onFileDrop,
    onClickAdd,
    fullWidth,
}: ImageDropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isUploading) return;

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onFileDrop(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isUploading) setIsDragOver(true);
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
            disabled={isUploading}
            className={`flex ${ratioClass} ${fullWidth ? 'w-full' : 'w-28 sm:w-32'} flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors ${
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
