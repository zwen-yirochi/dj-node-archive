// lib/validations/entry.schemas.ts
// Zod schema definitions for entries

import { z } from 'zod';

// ============================================
// Sub-schemas (shared)
// ============================================

export const venueReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const artistReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const externalLinkSchema = z.object({
    title: z.string().min(1).trim(),
    url: z.string().url(),
});

// ============================================
// Event Field Atoms (single source — per-field base validation rules)
// ============================================

const eventDateStrict = z.string().min(1, 'Date is required');
const eventLineupBase = z.array(artistReferenceSchema);
const eventDescriptionBase = z.string();
const eventLinksBase = z.array(externalLinkSchema).optional();

// ============================================
// Event Schemas
// ============================================

/** Fields shared between draft and publish */
const eventBaseFields = {
    title: z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title must be 100 characters or less')
        .trim(),
    posterUrls: z.array(z.string().min(1)).min(1, 'At least one poster image is required'),
    links: eventLinksBase,
};

/**
 * Draft event: only title and posterUrls are required (rest are optional/loose).
 * Used as the default resolver in forms.
 */
export const draftEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().default(''),
    venue: z
        .object({ id: z.string().uuid().optional(), name: z.string().default('') })
        .default({ name: '' }),
    lineup: eventLineupBase.default([]),
    description: eventDescriptionBase.default(''),
});

/**
 * Publish event: strict validation on all fields.
 * Used for additional validation when the publish option is selected.
 */
export const publishEventSchema = z.object({
    ...eventBaseFields,
    date: eventDateStrict,
    venue: venueReferenceSchema,
    lineup: eventLineupBase.min(1, 'At least one artist is required'),
    description: eventDescriptionBase.min(1, 'Description is required').trim(),
});

/** Form data types inferred from schemas (single source of truth) */
export type CreateEventData = z.infer<typeof publishEventSchema>;
export type CreateMixsetFormData = z.infer<typeof draftMixsetSchema>;
export type CreateLinkFormData = z.infer<typeof draftLinkSchema>;

// ============================================
// Event Field Schemas (for block components — per-field validation)
// ============================================

export const eventFieldSchemas = {
    date: z.object({ date: eventDateStrict }),
    venue: z.object({ venue: venueReferenceSchema }),
    lineup: z.object({ lineup: eventLineupBase }),
    description: z.object({ description: eventDescriptionBase }),
    links: z.object({ links: eventLinksBase }),
};

export type EventDateForm = z.infer<typeof eventFieldSchemas.date>;
export type EventVenueForm = z.infer<typeof eventFieldSchemas.venue>;
export type EventLineupForm = z.infer<typeof eventFieldSchemas.lineup>;
export type EventDescriptionForm = z.infer<typeof eventFieldSchemas.description>;
export type EventLinksForm = z.infer<typeof eventFieldSchemas.links>;

// ============================================
// Mixset Field Atoms
// ============================================

const mixsetUrlBase = z.string();
const tracklistItemSchema = z.object({
    track: z.string(),
    artist: z.string(),
    time: z.string(),
});
const mixsetTracklistBase = z.array(tracklistItemSchema);

// ============================================
// Mixset Schemas
// ============================================

const mixsetBase = z.object({
    title: z.string().min(1).max(100).trim(),
});

export const draftMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().default(''),
    url: mixsetUrlBase.url('Must be a valid URL'),
});

export const publishMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().min(1, 'Cover image is required'),
    url: mixsetUrlBase.url('Must be a valid URL'),
});

// ============================================
// Mixset Field Schemas (for block components)
// ============================================

/** URL field schema — shared block component for Mixset + Link */
export const urlFieldSchema = z.object({ url: z.string() });

export const mixsetFieldSchemas = {
    url: urlFieldSchema,
    description: z.object({ description: eventDescriptionBase }),
    tracklist: z.object({ tracklist: mixsetTracklistBase }),
};

// ============================================
// Link Field Atoms
// ============================================

const linkIconBase = z.string().optional();

// ============================================
// Link Schemas
// ============================================

const linkBase = z.object({
    title: z.string().min(1).max(100).trim(),
});

export const draftLinkSchema = linkBase.extend({
    url: z.string().min(1).trim(),
});

export const publishLinkSchema = linkBase.extend({
    url: z.string().url('Must be a valid URL'),
});

// ============================================
// Link Field Schemas (for block components)
// ============================================

export const linkFieldSchemas = {
    url: urlFieldSchema,
    description: z.object({ description: z.string() }),
    icon: z.object({ icon: linkIconBase }),
};

// ============================================
// Custom Entry Schemas
// ============================================

const sectionBlockSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['header', 'richtext', 'image', 'embed', 'keyvalue', 'list']),
    data: z.record(z.unknown()),
});

export const draftCustomSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100).trim(),
    blocks: z.array(sectionBlockSchema).default([]),
});

export const publishCustomSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100).trim(),
    blocks: z.array(sectionBlockSchema).min(1, 'At least one block is required'),
});

// ============================================
// API Request Schemas
// ============================================

/**
 * POST /api/entries - Create entry request
 *
 * The entry field uses .passthrough():
 * payload shape varies by type; detailed validation is performed in the handler.
 */
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

/**
 * PATCH /api/entries/[id] - Update entry request
 *
 * The entry field uses .passthrough():
 * payload shape varies by type; detailed validation is performed in the handler.
 */
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

/**
 * PATCH /api/entries/reorder - Reorder entries within a section
 */
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

/**
 * PATCH /api/entries/reorder-display - Reorder entries within a page
 */
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
