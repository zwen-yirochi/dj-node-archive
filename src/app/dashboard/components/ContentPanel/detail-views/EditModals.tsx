'use client';

import imageCompression from 'browser-image-compression';
import { useRef, useState } from 'react';
import Image from 'next/image';

import { ImagePlus, Loader2 } from 'lucide-react';

import { uploadPoster } from '@/app/dashboard/actions/upload';
import {
    DashboardDialogContent,
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/app/dashboard/components/ui/DashboardDialog';
import { Button } from '@/components/ui/button';

// ============================================
// ImageEditModal — Shared by Event (poster) + Mixset (cover)
// ============================================

export function ImageEditModal({
    value,
    onSave,
    onClose,
    aspectRatio = '3/4',
    title = 'Change poster image',
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
            setError('Upload failed');
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DashboardDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">{title}</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        Upload an image
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
                                alt="Current image"
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
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    Select image
                                </>
                            )}
                        </Button>
                    </div>
                    {error && <p className="text-center text-xs text-dashboard-danger">{error}</p>}
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={isUploading}
                            className="text-dashboard-text-muted"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}

// ============================================
// TitleEditModal — Shared by Event + Mixset + Link
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
            <DashboardDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">Edit title</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        Enter a new title
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
                        placeholder="Title"
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
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!inputValue.trim()}
                            className="bg-dashboard-text text-dashboard-bg hover:bg-dashboard-text/90"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}
