// lib/validations/entry.schemas.ts
// Entry 관련 Zod 스키마 정의

import { z } from 'zod';
import type { CreateEventData } from '@/types/domain';

// ============================================
// Sub-schemas (공통)
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
// Event Schemas
// ============================================

/**
 * Draft event: title과 posterUrl만 필수 (나머지 optional/느슨)
 * 폼에서 기본 resolver로 사용
 */
export const draftEventSchema = z.object({
    title: z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title must be 100 characters or less')
        .trim(),
    posterUrl: z.string().min(1, 'Poster image is required').trim(),
    date: z.string().optional().default(''),
    venue: z
        .object({ id: z.string().uuid().optional(), name: z.string().default('') })
        .optional()
        .default({ name: '' }),
    lineup: z.array(artistReferenceSchema).optional().default([]),
    description: z.string().optional().default(''),
    links: z.array(externalLinkSchema).optional(),
});

/**
 * Publish event: 모든 필드 엄격 검증
 * publish 옵션 선택 시 추가 검증에 사용
 */
export const publishEventSchema = z.object({
    title: z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title must be 100 characters or less')
        .trim(),
    date: z.string().min(1, 'Date is required'),
    venue: venueReferenceSchema,
    lineup: z.array(artistReferenceSchema).min(1, 'At least one artist is required'),
    posterUrl: z.string().min(1, 'Poster image is required').trim(),
    description: z.string().min(1, 'Description is required').trim(),
    links: z.array(externalLinkSchema).optional(),
}) satisfies z.ZodType<CreateEventData>;

/**
 * Create event: publishEventSchema와 동일
 */
export const createEventSchema = publishEventSchema;

// ============================================
// API Request Schemas
// ============================================

/**
 * POST /api/entries - 엔트리 생성 요청
 */
export const createEntryRequestSchema = z.object({
    pageId: z.string().uuid('Invalid page ID'),
    entry: z
        .object({
            id: z.string().uuid(),
            type: z.enum(['event', 'mixset', 'link']),
        })
        .passthrough(),
    publishOption: z.enum(['publish', 'private']).optional().default('private'),
});

/**
 * PATCH /api/entries/[id] - 엔트리 수정 요청
 */
export const updateEntryRequestSchema = z
    .object({
        entry: z
            .object({
                id: z.string().uuid(),
                type: z.enum(['event', 'mixset', 'link']),
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
        { message: 'At least one of entry, displayOrder, or isVisible is required' }
    );

/**
 * PATCH /api/entries/reorder - 섹션 내 순서 변경
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
 * PATCH /api/entries/reorder-display - Page 내 순서 변경
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
