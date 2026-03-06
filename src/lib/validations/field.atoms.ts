/**
 * Field Schema Atoms — 모든 field validation의 단일 소스
 *
 * entry.schemas.ts와 shared-fields/fieldConfigs.ts 모두 이 atom을 import한다.
 * atom 자체는 필드 하나의 기본 검증 규칙만 정의하며,
 * draft/publish 수준의 조합은 entry.schemas.ts가 담당한다.
 */

import { z } from 'zod';

// ============================================
// Sub-schemas (복합 객체)
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

export const tracklistItemSchema = z.object({
    track: z.string(),
    artist: z.string(),
    time: z.string(),
});

export const sectionBlockSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['header', 'richtext', 'image', 'embed', 'keyvalue']),
    data: z.record(z.unknown()),
});

// ============================================
// 단일값 atoms
// ============================================

export const titleAtom = z.string().min(1).max(100).trim();
export const dateAtom = z.string();
export const dateStrictAtom = z.string().min(1, 'Date is required');
export const urlAtom = z.string();
export const urlStrictAtom = z.string().url('Must be a valid URL');
export const descriptionAtom = z.string();
export const iconAtom = z.string().optional();
export const imageUrlsAtom = z.array(z.string().min(1));

// ============================================
// 복합값 atoms
// ============================================

export const lineupAtom = z.array(artistReferenceSchema);
export const tracklistAtom = z.array(tracklistItemSchema);
export const blocksAtom = z.array(sectionBlockSchema);
