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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

import type { ProfileLink } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

import { buildLinkItems, toProfileLinks, type LinkItem } from './links.utils';
import { SortableLinkRow } from './SortableLinkRow';

interface LinksSectionProps {
    links: ProfileLink[];
    onSave: (links: ProfileLink[]) => void;
}

export default function LinksSection({ links, onSave }: LinksSectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [items, setItems] = useState<LinkItem[]>(() => buildLinkItems(links));
    const dndId = useId();
    const customCounter = useRef(0);

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

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            debouncedSave.cancel();
            setItems((prev) => {
                const oldIdx = prev.findIndex((i) => i.id === active.id);
                const newIdx = prev.findIndex((i) => i.id === over.id);
                if (oldIdx === -1 || newIdx === -1) return prev;

                const next = [...prev];
                const [moved] = next.splice(oldIdx, 1);
                next.splice(newIdx, 0, moved);

                onSave(toProfileLinks(next));
                return next;
            });
        },
        [onSave, debouncedSave]
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

    const handleToggle = useCallback(
        (id: string) => {
            debouncedSave.cancel();
            setItems((prev) => {
                const next = prev.map((item) => {
                    if (item.id !== id || !item.isPreset) return item;
                    return { ...item, enabled: !item.enabled };
                });
                onSave(toProfileLinks(next));
                return next;
            });
        },
        [onSave, debouncedSave]
    );

    const handleCommit = useCallback(() => {
        debouncedSave.cancel();
        setItems((prev) => {
            onSave(toProfileLinks(prev));
            return prev;
        });
    }, [onSave, debouncedSave]);

    const handleAddCustom = useCallback(() => {
        customCounter.current += 1;
        const newItem: LinkItem = {
            id: `custom-${Date.now()}-${customCounter.current}`,
            type: 'custom',
            url: '',
            label: '',
            isPreset: false,
            enabled: true,
        };
        setItems((prev) => [...prev, newItem]);
    }, []);

    const handleRemoveCustom = useCallback(
        (id: string) => {
            debouncedSave.cancel();
            setItems((prev) => {
                const next = prev.filter((item) => item.id !== id);
                onSave(toProfileLinks(next));
                return next;
            });
        },
        [onSave, debouncedSave]
    );

    return (
        <section>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                )}
                <h3 className="text-sm font-semibold text-dashboard-text">Links</h3>
            </button>

            {isOpen && (
                <div className="mt-4">
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
                                    onToggle={handleToggle}
                                    onUrlChange={handleUrlChange}
                                    onLabelChange={handleLabelChange}
                                    onRemove={item.isPreset ? undefined : handleRemoveCustom}
                                    onCommit={handleCommit}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <button
                        type="button"
                        onClick={handleAddCustom}
                        className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-dashboard-text-muted hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Custom Link</span>
                    </button>
                </div>
            )}
        </section>
    );
}
