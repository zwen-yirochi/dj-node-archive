'use client';

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { ChevronDown, ChevronRight, GripVertical, Plus, X } from 'lucide-react';

import type { ProfileLink, ProfileLinkType } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';

import {
    getPlatformLabel,
    getPlatformPlaceholder,
    PLATFORM_PRESETS,
} from '../../config/profileLinksConfig';

// ============================================
// Types
// ============================================

/** Internal representation — presets always exist, active = has URL */
interface LinkItem {
    id: string; // stable ID for dnd-kit
    type: ProfileLinkType;
    url: string;
    label?: string;
    isPreset: boolean;
}

// Preset types (always visible, cannot be deleted)
const PRESET_TYPES = PLATFORM_PRESETS.filter((p) => p.type !== 'custom').map((p) => p.type);

// ============================================
// Helpers: ProfileLink[] <-> LinkItem[]
// ============================================

function buildLinkItems(links: ProfileLink[]): LinkItem[] {
    const items: LinkItem[] = [];

    // Add active presets and custom links in their saved order
    for (const link of links) {
        const isPreset = PRESET_TYPES.includes(link.type);
        items.push({
            id: isPreset ? `preset-${link.type}` : `custom-${Date.now()}-${Math.random()}`,
            type: link.type,
            url: link.url,
            label: link.label,
            isPreset,
        });
    }

    // Append inactive presets (not in saved links) at the end
    for (const presetType of PRESET_TYPES) {
        if (!links.some((l) => l.type === presetType)) {
            items.push({
                id: `preset-${presetType}`,
                type: presetType,
                url: '',
                isPreset: true,
            });
        }
    }

    return items;
}

function toProfileLinks(items: LinkItem[]): ProfileLink[] {
    // Only export items that have a URL (active presets + custom links with URL)
    return items
        .filter((item) => item.url.trim() !== '')
        .map((item) => ({
            type: item.type,
            url: item.url,
            ...(item.type === 'custom' && item.label ? { label: item.label } : {}),
        }));
}

// ============================================
// Props
// ============================================

interface LinksSectionProps {
    links: ProfileLink[];
    onSave: (links: ProfileLink[]) => void;
}

// ============================================
// SortableLinkRow
// ============================================

interface SortableLinkRowProps {
    item: LinkItem;
    onUrlChange: (id: string, url: string) => void;
    onLabelChange: (id: string, label: string) => void;
    onRemove?: (id: string) => void;
}

function SortableLinkRow({ item, onUrlChange, onLabelChange, onRemove }: SortableLinkRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = item.url.trim() !== '';
    const isCustom = item.type === 'custom';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 border-b border-dashboard-border px-3 py-2 last:border-b-0',
                isDragging && 'z-10 bg-dashboard-bg-surface shadow-md',
                !isActive && item.isPreset && 'opacity-50'
            )}
        >
            {/* Drag handle */}
            <button
                type="button"
                className="shrink-0 cursor-grab touch-none text-dashboard-text-muted hover:text-dashboard-text active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            {/* Platform label */}
            <span
                className={cn(
                    'w-20 shrink-0 text-xs font-medium',
                    isActive ? 'text-dashboard-text' : 'text-dashboard-text-muted'
                )}
            >
                {isCustom ? item.label || 'Custom' : getPlatformLabel(item.type)}
            </span>

            {/* URL input */}
            <Input
                value={item.url}
                onChange={(e) => onUrlChange(item.id, e.target.value)}
                placeholder={getPlatformPlaceholder(item.type)}
                className="h-7 flex-1 border-0 bg-transparent px-2 text-xs text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />

            {/* Custom label input */}
            {isCustom && (
                <Input
                    value={item.label || ''}
                    onChange={(e) => onLabelChange(item.id, e.target.value)}
                    placeholder="Label"
                    className="h-7 w-20 border-0 bg-transparent px-2 text-xs text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
                />
            )}

            {/* Remove button (custom only) */}
            {isCustom && onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 rounded p-0.5 text-dashboard-text-muted hover:text-dashboard-text"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

// ============================================
// LinksSection
// ============================================

export default function LinksSection({ links, onSave }: LinksSectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [items, setItems] = useState<LinkItem[]>(() => buildLinkItems(links));
    const dndId = useId();
    const customCounter = useRef(0);

    // Sync from parent when links prop changes
    useEffect(() => {
        setItems(buildLinkItems(links));
    }, [links]);

    const debouncedSave = useDebounce((updated: LinkItem[]) => {
        onSave(toProfileLinks(updated));
    }, 500);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ---- Handlers ----

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setItems((prev) => {
                const oldIdx = prev.findIndex((i) => i.id === active.id);
                const newIdx = prev.findIndex((i) => i.id === over.id);
                if (oldIdx === -1 || newIdx === -1) return prev;

                const next = [...prev];
                const [moved] = next.splice(oldIdx, 1);
                next.splice(newIdx, 0, moved);

                // Immediate save on reorder (order matters)
                onSave(toProfileLinks(next));
                return next;
            });
        },
        [onSave]
    );

    const handleUrlChange = useCallback(
        (id: string, url: string) => {
            setItems((prev) => {
                const next = prev.map((item) => (item.id === id ? { ...item, url } : item));
                debouncedSave(next);
                return next;
            });
        },
        [debouncedSave]
    );

    const handleLabelChange = useCallback(
        (id: string, label: string) => {
            setItems((prev) => {
                const next = prev.map((item) => (item.id === id ? { ...item, label } : item));
                debouncedSave(next);
                return next;
            });
        },
        [debouncedSave]
    );

    const handleAddCustom = useCallback(() => {
        customCounter.current += 1;
        const newItem: LinkItem = {
            id: `custom-${Date.now()}-${customCounter.current}`,
            type: 'custom',
            url: '',
            label: '',
            isPreset: false,
        };
        setItems((prev) => [...prev, newItem]);
    }, []);

    const handleRemoveCustom = useCallback(
        (id: string) => {
            setItems((prev) => {
                const next = prev.filter((item) => item.id !== id);
                onSave(toProfileLinks(next));
                return next;
            });
        },
        [onSave]
    );

    return (
        <section>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-2 text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    Links
                </h3>
            </button>

            {isOpen && (
                <div className="mt-4 overflow-hidden rounded-lg border border-dashboard-border">
                    <DndContext
                        id={dndId}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((item) => (
                                <SortableLinkRow
                                    key={item.id}
                                    item={item}
                                    onUrlChange={handleUrlChange}
                                    onLabelChange={handleLabelChange}
                                    onRemove={item.isPreset ? undefined : handleRemoveCustom}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Add Custom Link */}
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        className="flex w-full items-center gap-1.5 border-t border-dashboard-border px-3 py-2 text-xs text-dashboard-text-muted hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>커스텀 링크 추가</span>
                    </button>
                </div>
            )}
        </section>
    );
}
