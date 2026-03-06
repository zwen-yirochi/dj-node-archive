'use client';

import {
    closestCenter,
    DndContext,
    DragOverlay,
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
import { useCallback, useId, useState, type ComponentType } from 'react';

import { Plus } from 'lucide-react';

import type { CustomEntry, SectionBlock, SectionBlockDataMap, SectionBlockType } from '@/types';
import {
    createBlock,
    SECTION_BLOCK_CONFIG,
    SECTION_BLOCK_TYPES,
} from '@/app/dashboard/config/customBlockConfig';
import { Button } from '@/components/ui/button';

import {
    EmbedSection,
    HeaderSection,
    ImageSection,
    KeyValueSection,
    RichTextSection,
} from './custom-blocks';
import BlockWrapper from './custom-blocks/BlockWrapper';
import type { SectionBlockEditorProps } from './custom-blocks/types';

// ============================================
// Block Component Registry
// ============================================

const BLOCK_COMPONENT_MAP: Record<SectionBlockType, ComponentType<SectionBlockEditorProps<any>>> = {
    header: HeaderSection,
    richtext: RichTextSection,
    image: ImageSection,
    embed: EmbedSection,
    keyvalue: KeyValueSection,
};

// ============================================
// SortableBlock
// ============================================

interface SortableBlockProps {
    block: SectionBlock;
    onUpdate: (id: string, data: SectionBlockDataMap[SectionBlockType]) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}

function SortableBlock({ block, onUpdate, onRemove, disabled }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = SECTION_BLOCK_CONFIG[block.type];
    const BlockComponent = BLOCK_COMPONENT_MAP[block.type];

    return (
        <div ref={setNodeRef} style={style}>
            <BlockWrapper
                label={config.label}
                icon={config.icon}
                onDelete={() => onRemove(block.id)}
                dragHandleProps={{ attributes, listeners }}
                isDragging={isDragging}
                disabled={disabled}
            >
                <BlockComponent
                    data={block.data as any}
                    onChange={(newData) => onUpdate(block.id, newData)}
                    disabled={disabled}
                />
            </BlockWrapper>
        </div>
    );
}

// ============================================
// BlockToolbar
// ============================================

function BlockToolbar({
    onAdd,
    disabled,
}: {
    onAdd: (type: SectionBlockType) => void;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="w-full gap-2 border border-dashed border-dashboard-border text-dashboard-text-muted hover:border-dashboard-border-hover hover:text-dashboard-text"
            >
                <Plus className="h-4 w-4" />
                Add block
            </Button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-1 shadow-lg">
                    {SECTION_BLOCK_TYPES.map((type) => {
                        const config = SECTION_BLOCK_CONFIG[type];
                        const Icon = config.icon;
                        return (
                            <button
                                key={type}
                                onClick={() => {
                                    onAdd(type);
                                    setIsOpen(false);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-dashboard-text-secondary transition-colors hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                            >
                                <Icon className="h-4 w-4" />
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============================================
// CustomEntryEditor
// ============================================

interface CustomEntryEditorProps {
    entry: CustomEntry;
    onBlocksChange: (blocks: SectionBlock[]) => void;
    disabled?: boolean;
}

export default function CustomEntryEditor({
    entry,
    onBlocksChange,
    disabled,
}: CustomEntryEditorProps) {
    const dndId = useId();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const blocks = entry.blocks;

    const handleAddBlock = useCallback(
        (type: SectionBlockType) => {
            const newBlock = createBlock(type);
            onBlocksChange([...blocks, newBlock]);
        },
        [blocks, onBlocksChange]
    );

    const handleUpdateBlock = useCallback(
        (id: string, data: SectionBlockDataMap[SectionBlockType]) => {
            const updated = blocks.map((b) => (b.id === id ? { ...b, data } : b));
            onBlocksChange(updated);
        },
        [blocks, onBlocksChange]
    );

    const handleRemoveBlock = useCallback(
        (id: string) => {
            onBlocksChange(blocks.filter((b) => b.id !== id));
        },
        [blocks, onBlocksChange]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);
            if (!over || active.id === over.id) return;

            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = [...blocks];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            onBlocksChange(reordered);
        },
        [blocks, onBlocksChange]
    );

    const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

    return (
        <div className="space-y-2">
            {blocks.length > 0 ? (
                <DndContext
                    id={dndId}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(String(e.active.id))}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={blocks.map((b) => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.map((block) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                onUpdate={handleUpdateBlock}
                                onRemove={handleRemoveBlock}
                                disabled={disabled}
                            />
                        ))}
                    </SortableContext>

                    <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                        {activeBlock && (
                            <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card p-3 shadow-lg">
                                <span className="text-sm text-dashboard-text">
                                    {SECTION_BLOCK_CONFIG[activeBlock.type].label}
                                </span>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-dashboard-border py-12">
                    <p className="mb-1 text-sm text-dashboard-text-muted">No blocks yet</p>
                    <p className="text-xs text-dashboard-text-placeholder">
                        Add blocks to build your custom entry
                    </p>
                </div>
            )}

            <BlockToolbar onAdd={handleAddBlock} disabled={disabled} />
        </div>
    );
}
