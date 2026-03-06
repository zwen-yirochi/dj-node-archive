/**
 * Entry-level Zod schemas — draft/publish 조합
 *
 * atom은 field.atoms.ts에서 import하며,
 * 이 파일은 entry 수준의 조합(draft 기본값, publish 필수값)만 담당한다.
 */

import { z } from 'zod';

import {
    blocksAtom,
    dateStrictAtom,
    descriptionAtom,
    externalLinkSchema,
    imageUrlsAtom,
    lineupAtom,
    titleAtom,
    urlStrictAtom,
    venueReferenceSchema,
} from './field.atoms';

// ============================================
// Event Schemas
// ============================================

const eventBaseFields = {
    title: titleAtom.min(2, 'Title must be at least 2 characters'),
    imageUrls: imageUrlsAtom.min(1, 'At least one image is required'),
    links: z.array(externalLinkSchema).optional(),
};

export const draftEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().default(''),
    venue: z
        .object({ id: z.string().uuid().optional(), name: z.string().default('') })
        .default({ name: '' }),
    lineup: lineupAtom.default([]),
    description: descriptionAtom.default(''),
});

export const publishEventSchema = z.object({
    ...eventBaseFields,
    date: dateStrictAtom,
    venue: venueReferenceSchema,
    lineup: lineupAtom.min(1, 'At least one artist is required'),
    description: descriptionAtom.min(1, 'Description is required').trim(),
});

// ============================================
// Mixset Schemas
// ============================================

const mixsetBase = z.object({
    title: titleAtom,
});

export const draftMixsetSchema = mixsetBase.extend({
    imageUrls: imageUrlsAtom.default([]),
    url: urlStrictAtom,
});

export const publishMixsetSchema = mixsetBase.extend({
    imageUrls: imageUrlsAtom.min(1, 'At least one image is required'),
    url: urlStrictAtom,
});

// ============================================
// Link Schemas
// ============================================

const linkBase = z.object({
    title: titleAtom,
});

export const draftLinkSchema = linkBase.extend({
    url: z.string().min(1).trim(),
    imageUrls: imageUrlsAtom.default([]),
});

export const publishLinkSchema = linkBase.extend({
    url: urlStrictAtom,
    imageUrls: imageUrlsAtom.default([]),
});

// ============================================
// Custom Entry Schemas
// ============================================

export const draftCustomSchema = z.object({
    title: titleAtom.min(1, 'Title is required'),
    blocks: blocksAtom.default([]),
});

export const publishCustomSchema = z.object({
    title: titleAtom.min(1, 'Title is required'),
    blocks: blocksAtom.min(1, 'At least one block is required'),
});

// ============================================
// Form data types
// ============================================

export type CreateEventData = z.infer<typeof publishEventSchema>;
export type CreateMixsetFormData = z.infer<typeof draftMixsetSchema>;
export type CreateLinkFormData = z.infer<typeof draftLinkSchema>;

// ============================================
// API Request Schemas
// ============================================

export const createEntryRequestSchema = z.object({
    pageId: z.string().uuid('Invalid page ID'),
    entry: z
        .object({
            id: z.string().uuid(),
            type: z.enum(['event', 'mixset', 'link', 'custom']),
        })
        .passthrough(),
    publishOption: z.enum(['publish', 'private']).default('private'),
});

export const updateEntryRequestSchema = z
    .object({
        entry: z
            .object({
                id: z.string().uuid(),
                type: z.enum(['event', 'mixset', 'link', 'custom']),
            })
            .passthrough()
            .optional(),
        displayOrder: z.number().int().nullable().optional(),
        isVisible: z.boolean().optional(),
    })
    .refine(
        (data) =>
            data.entry !== undefined ||
            data.displayOrder !== undefined ||
            data.isVisible !== undefined,
        { message: 'At least one of entry, displayOrder, isVisible is required' }
    );

export const reorderEntriesRequestSchema = z.object({
    updates: z
        .array(
            z.object({
                id: z.string().uuid(),
                position: z.number().int().min(0),
            })
        )
        .min(1, 'At least one update is required'),
});

export const reorderDisplayEntriesRequestSchema = z.object({
    updates: z
        .array(
            z.object({
                id: z.string().uuid(),
                displayOrder: z.number().int().min(0).nullable(),
            })
        )
        .min(1, 'At least one update is required'),
});
