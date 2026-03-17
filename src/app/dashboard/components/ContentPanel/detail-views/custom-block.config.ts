/**
 * Custom block configuration — section block types for custom entries
 *
 * Maps each ContentBlockType to its label, icon, Zod schema, and default data factory.
 * Component mapping is handled separately in the editor (lazy imports).
 */

import { v4 as uuidv4 } from 'uuid';

import { z, type ZodSchema } from 'zod';

import {
    AlignLeft,
    Heading,
    Image as ImageIcon,
    KeyRound,
    Link2,
    type LucideIcon,
} from 'lucide-react';

import type { ContentBlockDataMap, ContentBlockType } from '@/types';

// ============================================
// Block Config Interface
// ============================================

export interface ContentBlockConfig<T extends ContentBlockType = ContentBlockType> {
    type: T;
    label: string;
    icon: LucideIcon;
    schema: ZodSchema;
    defaultData: () => ContentBlockDataMap[T];
}

// ============================================
// Per-Block Schemas
// ============================================

export const blockSchemas = {
    header: z.object({
        title: z.string().min(1, 'Title is required'),
        subtitle: z.string().optional(),
    }),
    richtext: z.object({
        content: z.string(),
    }),
    image: z.object({
        url: z.string().min(1, 'Image URL is required'),
        alt: z.string().optional(),
        caption: z.string().optional(),
    }),
    embed: z.object({
        url: z.string().url('Must be a valid URL'),
        provider: z.string().optional(),
    }),
    keyvalue: z.object({
        items: z.array(z.object({ key: z.string(), value: z.string() })),
    }),
} as const;

// ============================================
// Block Config Registry
// ============================================

export const CONTENT_BLOCK_CONFIG: Record<ContentBlockType, ContentBlockConfig> = {
    header: {
        type: 'header',
        label: 'Header',
        icon: Heading,
        schema: blockSchemas.header,
        defaultData: () => ({ title: '', subtitle: undefined }),
    },
    richtext: {
        type: 'richtext',
        label: 'Text',
        icon: AlignLeft,
        schema: blockSchemas.richtext,
        defaultData: () => ({ content: '' }),
    },
    image: {
        type: 'image',
        label: 'Image',
        icon: ImageIcon,
        schema: blockSchemas.image,
        defaultData: () => ({ url: '', alt: undefined, caption: undefined }),
    },
    embed: {
        type: 'embed',
        label: 'Embed',
        icon: Link2,
        schema: blockSchemas.embed,
        defaultData: () => ({ url: '', provider: undefined }),
    },
    keyvalue: {
        type: 'keyvalue',
        label: 'Key-Value',
        icon: KeyRound,
        schema: blockSchemas.keyvalue,
        defaultData: () => ({ items: [{ key: '', value: '' }] }),
    },
};

// ============================================
// Helpers
// ============================================

export const CONTENT_BLOCK_TYPES = Object.keys(CONTENT_BLOCK_CONFIG) as ContentBlockType[];

export function createBlock<T extends ContentBlockType>(type: T) {
    const config = CONTENT_BLOCK_CONFIG[type];
    return {
        id: uuidv4(),
        type,
        data: config.defaultData(),
    };
}
