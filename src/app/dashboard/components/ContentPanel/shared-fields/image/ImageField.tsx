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
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useCallback, useId, useState } from 'react';
import Image from 'next/image';

import { Pencil } from 'lucide-react';

import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';

import type { ImageFieldProps } from '../types';
import ImageCard from './ImageCard';
import ImageDropZone from './ImageDropZone';
import { useImageUpload } from './useImageUpload';

// ============================================
// Constants
// ============================================

/** 갤러리 카드 고정 높이 (px) */
const CARD_HEIGHT = 160;
/** 빈 상태 드롭존 높이 (px) */
const EMPTY_HEIGHT = 128;
const DEFAULT_MAX_COUNT = 10;

// ============================================
// ImageField
// ============================================

export default function ImageField({
    value = [],
    onChange = () => {},
    disabled,
    maxCount = DEFAULT_MAX_COUNT,
}: ImageFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const {
        isUploading,
        error,
        canAdd,
        inputRef,
        uploadFiles,
        replaceFile,
        removeImage,
        handleFileSelect,
        openFilePicker,
    } = useImageUpload({ value, onChange, maxCount });

    const dndId = useId();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

    const { scrollRef } = useHorizontalScroll();

    const activeItem = activeId ? value.find((v) => v.id === activeId) : null;

    // ---- Empty state ----
    if (value.length === 0) {
        return (
            <div className="w-full">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={disabled}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <ImageDropZone
                    height={EMPTY_HEIGHT}
                    isUploading={isUploading}
                    disabled={disabled}
                    onFileDrop={uploadFiles}
                    onClickAdd={openFilePicker}
                    fullWidth
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    // ---- Gallery (view + edit) ----
    return (
        <div className="relative w-full space-y-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Header — count (left) + edit button (right) */}
            {!disabled && (
                <div className="flex items-center justify-between">
                    {isEditing ? (
                        <span className="text-xs text-dashboard-text-muted">
                            {value.length} / {maxCount}
                        </span>
                    ) : (
                        <span />
                    )}
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isEditing
                                ? 'border-dashboard-accent text-dashboard-accent hover:bg-dashboard-accent/10'
                                : 'border-transparent text-dashboard-text-muted hover:bg-dashboard-bg-muted hover:text-dashboard-text'
                        }`}
                    >
                        {isEditing ? (
                            'Done'
                        ) : (
                            <>
                                <Pencil className="h-3 w-3" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Image strip — center when fits, scroll left when overflows */}
            <div ref={scrollRef} className="scrollbar-thin overflow-x-auto pb-1">
                <div className="mx-auto flex w-fit gap-2">
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
                                <ImageCard
                                    key={item.id}
                                    item={item}
                                    height={CARD_HEIGHT}
                                    isEditing={isEditing}
                                    onRemove={removeImage}
                                    onReplace={replaceFile}
                                />
                            ))}
                        </SortableContext>

                        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                            {activeItem && (
                                <Image
                                    src={activeItem.url}
                                    alt=""
                                    width={300}
                                    height={CARD_HEIGHT}
                                    style={{ height: `${CARD_HEIGHT}px`, width: 'auto' }}
                                    className="border-dashboard-accent rounded-lg border-2 shadow-lg"
                                    unoptimized
                                />
                            )}
                        </DragOverlay>
                    </DndContext>

                    {/* Add / drop zone (edit mode only) */}
                    {isEditing && canAdd && (
                        <ImageDropZone
                            height={CARD_HEIGHT}
                            isUploading={isUploading}
                            onFileDrop={uploadFiles}
                            onClickAdd={openFilePicker}
                        />
                    )}
                </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
