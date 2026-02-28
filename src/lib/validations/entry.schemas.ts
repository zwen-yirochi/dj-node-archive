// lib/validations/entry.schemas.ts
// Entry 관련 Zod 스키마 정의

import { z } from 'zod';

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
        .min(2, '제목은 2자 이상이어야 합니다')
        .max(100, '제목은 100자 이하여야 합니다')
        .trim(),
    posterUrl: z.string().min(1, '포스터 이미지가 필요합니다').trim(),
    links: z.array(externalLinkSchema).optional(),
};

/**
 * Draft event: title과 posterUrl만 필수 (나머지 optional/느슨)
 * 폼에서 기본 resolver로 사용
 */
export const draftEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().default(''),
    venue: z
        .object({ id: z.string().uuid().optional(), name: z.string().default('') })
        .default({ name: '' }),
    lineup: z.array(artistReferenceSchema).default([]),
    description: z.string().default(''),
});

/**
 * Publish event: 모든 필드 엄격 검증
 * publish 옵션 선택 시 추가 검증에 사용
 */
export const publishEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().min(1, '날짜를 입력해야 합니다'),
    venue: venueReferenceSchema,
    lineup: z.array(artistReferenceSchema).min(1, '아티스트를 1명 이상 추가해야 합니다'),
    description: z.string().min(1, '설명을 입력해야 합니다').trim(),
});

/** 스키마에서 추론된 폼 데이터 타입 (단일 소스) */
export type CreateEventData = z.infer<typeof publishEventSchema>;
export type CreateMixsetFormData = z.infer<typeof draftMixsetSchema>;

// ============================================
// Event Field Schemas (블록 컴포넌트용 — 필드 단위 검증)
// ============================================

export const eventFieldSchemas = {
    date: z.object({ date: z.string().min(1, '날짜를 입력해야 합니다') }),
    venue: z.object({ venue: venueReferenceSchema }),
    lineup: z.object({ lineup: z.array(artistReferenceSchema) }),
    description: z.object({ description: z.string() }),
    links: z.object({ links: z.array(externalLinkSchema).optional() }),
};

export type EventDateForm = z.infer<typeof eventFieldSchemas.date>;
export type EventVenueForm = z.infer<typeof eventFieldSchemas.venue>;
export type EventLineupForm = z.infer<typeof eventFieldSchemas.lineup>;
export type EventDescriptionForm = z.infer<typeof eventFieldSchemas.description>;
export type EventLinksForm = z.infer<typeof eventFieldSchemas.links>;

// ============================================
// Mixset Schemas
// ============================================

const mixsetBase = z.object({
    title: z.string().min(1).max(100).trim(),
});

export const draftMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().default(''),
    url: z.string().default(''),
});

export const publishMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().min(1, '커버 이미지가 필요합니다'),
    url: z.string().url('유효한 URL이어야 합니다'),
});

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
    url: z.string().url('유효한 URL이어야 합니다'),
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
    pageId: z.string().uuid('유효하지 않은 페이지 ID입니다'),
    entry: z
        .object({
            id: z.string().uuid(),
            type: z.enum(['event', 'mixset', 'link']),
        })
        .passthrough(),
    publishOption: z.enum(['publish', 'private']).default('private'),
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
        { message: 'entry, displayOrder, isVisible 중 하나 이상 필요합니다' }
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
        .min(1, '하나 이상의 업데이트가 필요합니다'),
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
        .min(1, '하나 이상의 업데이트가 필요합니다'),
});
