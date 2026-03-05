'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef } from 'react';
import Image from 'next/image';

import { GripHorizontal, ImagePlus, Trash2 } from 'lucide-react';

import type { ImageItem } from './types';

interface ImageCardProps {
    item: ImageItem;
    ratioClass: string;
    isEditing: boolean;
    onRemove: (id: string) => void;
    onReplace: (id: string, file: File) => void;
}

export default function ImageCard({
    item,
    ratioClass,
    isEditing,
    onRemove,
    onReplace,
}: ImageCardProps) {
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        disabled: !isEditing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleReplaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onReplace(item.id, file);
        if (replaceInputRef.current) replaceInputRef.current.value = '';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group/card relative flex-shrink-0 ${isDragging ? 'opacity-30' : ''}`}
        >
            {/* Hidden file input for replace */}
            {isEditing && (
                <input
                    ref={replaceInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReplaceSelect}
                    className="hidden"
                />
            )}

            {/* Image */}
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

                {isEditing && (
                    <>
                        {/* Drag handle — top bar, subtle */}
                        <div
                            {...attributes}
                            {...(listeners as React.DOMAttributes<HTMLDivElement>)}
                            className="absolute left-0 right-0 top-0 z-10 flex cursor-grab items-center justify-center rounded-t-lg bg-black/15 py-1.5 opacity-0 transition-opacity active:cursor-grabbing group-hover/card:opacity-100"
                        >
                            <GripHorizontal className="h-3.5 w-3.5 text-white/70" />
                        </div>

                        {/* Action buttons — bottom */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1.5 rounded-b-lg bg-gradient-to-t from-black/40 to-transparent px-1 py-1.5 opacity-0 transition-opacity group-hover/card:opacity-100">
                            <button
                                type="button"
                                onClick={() => replaceInputRef.current?.click()}
                                className="rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white"
                                title="Replace"
                            >
                                <ImagePlus className="h-3 w-3 text-dashboard-text" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-red-50"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
