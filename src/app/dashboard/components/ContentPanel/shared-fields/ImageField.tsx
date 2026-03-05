'use client';

import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import imageCompression from 'browser-image-compression';
import { useCallback, useId, useRef, useState } from 'react';
import Image from 'next/image';

import { GripHorizontal, ImagePlus, Loader2, Pencil, Plus, X } from 'lucide-react';

import { deletePoster, uploadPoster } from '@/app/dashboard/actions/upload';

import type { ImageFieldProps, ImageItem } from './types';

// ============================================
// Constants
// ============================================

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

const DEFAULT_MAX_COUNT = 10;

function generateId() {
    return `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================
// SortableImage (edit mode only)
// ============================================

function SortableImage({
    item,
    ratioClass,
    onRemove,
    isRemoving,
}: {
    item: ImageItem;
    ratioClass: string;
    onRemove: (id: string) => void;
    isRemoving: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group/item relative flex-shrink-0 ${isDragging ? 'opacity-30' : ''}`}
        >
            <div
                className={`relative ${ratioClass} w-28 overflow-hidden rounded-lg border border-dashboard-border sm:w-32`}
            >
                <Image
                    src={item.url}
                    alt={item.alt || ''}
                    fill
                    className="object-cover"
                    sizes="128px"
                />
            </div>

            {/* Drag handle */}
            <button
                {...attributes}
                {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
                className="absolute bottom-1 left-1/2 -translate-x-1/2 cursor-grab rounded-full bg-black/50 p-1 opacity-0 backdrop-blur-sm transition-opacity active:cursor-grabbing group-hover/item:opacity-100"
            >
                <GripHorizontal className="h-3 w-3 text-white" />
            </button>

            {/* Delete button */}
            <button
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={isRemoving}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-md transition-opacity hover:bg-red-600 disabled:opacity-50"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

// ============================================
// ImageField
// ============================================

export default function ImageField({
    value,
    onChange,
    disabled,
    maxCount = DEFAULT_MAX_COUNT,
    aspectRatio = 'video',
    placeholder,
}: ImageFieldProps) {
    const ratioClass = ASPECT_RATIO_CLASS[aspectRatio] ?? 'aspect-video';
    const PlaceholderIcon = placeholder?.icon ?? ImagePlus;
    const placeholderText = placeholder?.text ?? 'Click or drag to upload';

    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const dndId = useId();
    const canAdd = value.length < maxCount;

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // ---- Upload ----
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        // Upload first file (could extend to multi-select later)
        uploadFile(files[0]);
        if (inputRef.current) inputRef.current.value = '';
    };

    // ---- Remove ----
    const handleRemove = useCallback(
        async (id: string) => {
            const item = value.find((v) => v.id === id);
            if (!item) return;

            setRemovingId(id);
            try {
                await deletePoster(item.url);
            } catch {
                // 삭제 실패해도 UI에서는 제거
            } finally {
                onChange(value.filter((v) => v.id !== id));
                setRemovingId(null);
            }
        },
        [onChange, value]
    );

    // ---- DND Reorder ----
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);
            if (!over || active.id === over.id) return;

            const oldIndex = value.findIndex((v) => v.id === active.id);
            const newIndex = value.findIndex((v) => v.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = [...value];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            onChange(reordered);
        },
        [onChange, value]
    );

    // ---- File Drop ----
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled || isUploading || !canAdd) return;

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled && !isUploading && canAdd) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const activeItem = activeId ? value.find((v) => v.id === activeId) : null;

    // ---- Empty state ----
    if (value.length === 0) {
        return (
            <div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                />
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
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    // ---- View mode ----
    if (!isEditing) {
        return (
            <div className="space-y-2">
                {/* Header — count + edit button */}
                {!disabled && (
                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-dashboard-text-muted transition-colors hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                        >
                            <Pencil className="h-3 w-3" />
                            Edit
                        </button>
                    </div>
                )}

                {/* Horizontal scroll */}
                <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                    {value.map((item) => (
                        <div
                            key={item.id}
                            className={`relative ${ratioClass} w-28 flex-shrink-0 overflow-hidden rounded-lg border border-dashboard-border sm:w-32`}
                        >
                            <Image
                                src={item.url}
                                alt={item.alt || ''}
                                fill
                                className="object-cover"
                                sizes="128px"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ---- Edit mode ----
    return (
        <div className="space-y-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Header — count + done button */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-dashboard-text-muted">
                    {value.length} / {maxCount}
                </span>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-dashboard-accent hover:bg-dashboard-accent/90 rounded-md px-3 py-1 text-xs font-medium text-white transition-colors"
                >
                    Done
                </button>
            </div>

            {/* Sortable image strip */}
            <div
                className="scrollbar-thin flex gap-2 overflow-x-auto pb-1"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <DndContext
                    id={dndId}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(String(e.active.id))}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={value.map((v) => v.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {value.map((item) => (
                            <SortableImage
                                key={item.id}
                                item={item}
                                ratioClass={ratioClass}
                                onRemove={handleRemove}
                                isRemoving={removingId === item.id}
                            />
                        ))}
                    </SortableContext>

                    <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                        {activeItem && (
                            <div
                                className={`relative ${ratioClass} border-dashboard-accent w-28 overflow-hidden rounded-lg border-2 shadow-lg sm:w-32`}
                            >
                                <Image
                                    src={activeItem.url}
                                    alt={activeItem.alt || ''}
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                {/* Add button */}
                {canAdd && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className={`flex ${ratioClass} w-28 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition-colors sm:w-32 ${
                            isDragOver
                                ? 'border-dashboard-accent bg-dashboard-accent/5'
                                : 'border-dashboard-border hover:border-dashboard-border-hover'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-dashboard-text-muted" />
                        ) : (
                            <Plus className="h-5 w-5 text-dashboard-text-placeholder" />
                        )}
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
