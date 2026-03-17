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
import { useCallback, useId, useState, type ReactNode } from 'react';

import { Plus } from 'lucide-react';

import type { ContentBlock, ContentBlockDataMap, ContentBlockType, CustomEntry } from '@/types';
import { defaultDropAnimation, sortableAnimateLayoutChanges } from '@/lib/dnd/animate';
import { parseEmbedUrl } from '@/lib/embed';
import { Button } from '@/components/ui/button';

import {
    EmbedField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    KEYVALUE_FIELD_CONFIG,
    KeyValueField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import BlockWrapper from './BlockWrapper';
import { CONTENT_BLOCK_CONFIG, CONTENT_BLOCK_TYPES, createBlock } from './custom-block.config';

// ============================================
// Block Renderers
// ============================================

interface BlockRenderProps {
    data: ContentBlockDataMap[ContentBlockType];
    onChange: (data: ContentBlockDataMap[ContentBlockType]) => void;
    disabled?: boolean;
}

// url string → ImageItem[] conversion helper
const toImageItems = (url: string): ImageItem[] => (url ? [{ id: 'block-img', url }] : []);

const KV_COLUMNS = [
    {
        key: 'key',
        placeholder: 'Label',
        width: 'w-28 shrink-0',
        className: 'font-medium text-dashboard-text-secondary',
    },
    { key: 'value', placeholder: 'Value', width: 'flex-1' },
];
const EMPTY_KV = { key: '', value: '' };

const BLOCK_RENDERERS: Record<ContentBlockType, (props: BlockRenderProps) => ReactNode> = {
    header: ({ data, onChange, disabled }) => {
        const d = data as ContentBlockDataMap['header'];
        return (
            <div className="space-y-1">
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={d.title}
                    onSave={(v) => onChange({ ...d, title: v })}
                >
                    <TextField
                        disabled={disabled}
                        placeholder="Heading"
                        className="text-lg font-bold text-dashboard-text"
                    />
                </SyncedField>
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={d.subtitle || ''}
                    onSave={(v) => onChange({ ...d, subtitle: v || undefined })}
                >
                    <TextField
                        disabled={disabled}
                        placeholder="Subtitle (optional)"
                        className="text-sm text-dashboard-text-secondary"
                    />
                </SyncedField>
            </div>
        );
    },
    richtext: ({ data, onChange, disabled }) => {
        const d = data as ContentBlockDataMap['richtext'];
        return (
            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={d.content}
                onSave={(v) => onChange({ ...d, content: v })}
            >
                <TextField
                    disabled={disabled}
                    variant="textarea"
                    placeholder="Write something..."
                    rows={3}
                    className="min-h-[80px] text-sm text-dashboard-text"
                />
            </SyncedField>
        );
    },
    image: ({ data, onChange, disabled }) => {
        const d = data as ContentBlockDataMap['image'];
        return (
            <SyncedField
                config={IMAGE_FIELD_CONFIG}
                value={toImageItems(d.url)}
                onSave={(items) => onChange({ url: items[0]?.url || '' })}
            >
                <ImageField disabled={disabled} maxCount={1} />
            </SyncedField>
        );
    },
    embed: ({ data, onChange, disabled }) => {
        const d = data as ContentBlockDataMap['embed'];
        return (
            <SyncedField
                config={URL_FIELD_CONFIG}
                value={d.url}
                onSave={(v) => {
                    const parsed = parseEmbedUrl(v);
                    onChange({ url: v, provider: parsed?.provider });
                }}
            >
                <EmbedField disabled={disabled} />
            </SyncedField>
        );
    },
    keyvalue: ({ data, onChange, disabled }) => {
        const d = data as ContentBlockDataMap['keyvalue'];
        return (
            <SyncedField
                config={KEYVALUE_FIELD_CONFIG}
                value={d.items}
                onSave={(v) => onChange({ ...d, items: v })}
                indicatorPosition="top-right"
            >
                <KeyValueField
                    disabled={disabled}
                    columns={[...KV_COLUMNS]}
                    emptyItem={EMPTY_KV}
                    addLabel="Add field"
                />
            </SyncedField>
        );
    },
};

// ============================================
// SortableBlock
// ============================================

interface SortableBlockProps {
    block: ContentBlock;
    onUpdate: (id: string, data: ContentBlockDataMap[ContentBlockType]) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}

function SortableBlock({ block, onUpdate, onRemove, disabled }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        animateLayoutChanges: sortableAnimateLayoutChanges,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = CONTENT_BLOCK_CONFIG[block.type];
    const render = BLOCK_RENDERERS[block.type];

    if (!config || !render) return null;

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
                {render({ data: block.data, onChange: (d) => onUpdate(block.id, d), disabled })}
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
    onAdd: (type: ContentBlockType) => void;
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
                    {CONTENT_BLOCK_TYPES.map((type) => {
                        const config = CONTENT_BLOCK_CONFIG[type];
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
    onBlocksChange: (blocks: ContentBlock[]) => void;
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
        (type: ContentBlockType) => {
            const newBlock = createBlock(type);
            onBlocksChange([...blocks, newBlock]);
        },
        [blocks, onBlocksChange]
    );

    const handleUpdateBlock = useCallback(
        (id: string, data: ContentBlockDataMap[ContentBlockType]) => {
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

                    <DragOverlay dropAnimation={defaultDropAnimation}>
                        {activeBlock && (
                            <div className="drag-overlay-card p-3">
                                <span className="text-sm text-dashboard-text">
                                    {CONTENT_BLOCK_CONFIG[activeBlock.type].label}
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
