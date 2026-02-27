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

/** draft/publish 공통 필드 */
const eventBaseFields = {
    title: z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title must be 100 characters or less')
        .trim(),
    posterUrl: z.string().min(1, 'Poster image is required').trim(),
    links: z.array(externalLinkSchema).optional(),
};

/**
 * Draft event: title과 posterUrl만 필수 (나머지 optional/느슨)
 * 폼에서 기본 resolver로 사용
 */
export const draftEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().optional().default(''),
    venue: z
        .object({ id: z.string().uuid().optional(), name: z.string().default('') })
        .optional()
        .default({ name: '' }),
    lineup: z.array(artistReferenceSchema).optional().default([]),
    description: z.string().optional().default(''),
});

/**
 * Publish event: 모든 필드 엄격 검증
 * publish 옵션 선택 시 추가 검증에 사용
 */
export const publishEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().min(1, 'Date is required'),
    venue: venueReferenceSchema,
    lineup: z.array(artistReferenceSchema).min(1, 'At least one artist is required'),
    description: z.string().min(1, 'Description is required').trim(),
}) satisfies z.ZodType<CreateEventData>;

// ============================================
// Mixset Schemas
// ============================================

export const draftMixsetSchema = z.object({
    title: z.string().min(1).max(100).trim(),
});

export const publishMixsetSchema = z
    .object({
        title: z.string().min(1).max(100).trim(),
        coverUrl: z.string().min(1),
        audioUrl: z.string().optional().default(''),
        soundcloudUrl: z.string().optional().default(''),
    })
    .refine((d) => !!d.audioUrl?.trim() || !!d.soundcloudUrl?.trim(), {
        message: '오디오 URL 또는 SoundCloud URL이 필요합니다',
        path: ['audioUrl'],
    });

// ============================================
// Link Schemas
// ============================================

export const draftLinkSchema = z.object({
    title: z.string().min(1).max(100).trim(),
    url: z.string().min(1).trim(),
});

export const publishLinkSchema = z.object({
    title: z.string().min(1).max(100).trim(),
    url: z.string().url('Valid URL is required'),
});

// ============================================
// API Request Schemas
// ============================================

/**
 * POST /api/entries - 엔트리 생성 요청
 *
 * entry 필드는 .passthrough() 유지:
 * type별로 payload 형태가 다르며, 상세 검증은 handler에서 수행.
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
 *
 * entry 필드는 .passthrough() 유지:
 * type별로 payload 형태가 다르며, 상세 검증은 handler에서 수행.
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
