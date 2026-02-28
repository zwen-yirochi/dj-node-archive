/**
 * 필드 블록 검증 스키마 — 블록 컴포넌트 + fieldBlockConfig 양쪽에서 import
 */

import { z } from 'zod';

import {
    artistReferenceSchema,
    externalLinkSchema,
    venueReferenceSchema,
} from '@/lib/validations/entry.schemas';

export const dateBlockSchema = z.object({
    date: z.string().min(1, '날짜를 입력해야 합니다'),
});

export const venueBlockSchema = z.object({
    venue: venueReferenceSchema,
});

export const lineupBlockSchema = z.object({
    lineup: z.array(artistReferenceSchema),
});

export const descriptionBlockSchema = z.object({
    description: z.string(),
});

export const linksBlockSchema = z.object({
    links: z.array(externalLinkSchema).optional(),
});

export type DateFormValues = z.infer<typeof dateBlockSchema>;
export type VenueFormValues = z.infer<typeof venueBlockSchema>;
export type LineupFormValues = z.infer<typeof lineupBlockSchema>;
export type DescriptionFormValues = z.infer<typeof descriptionBlockSchema>;
export type LinksFormValues = z.infer<typeof linksBlockSchema>;
