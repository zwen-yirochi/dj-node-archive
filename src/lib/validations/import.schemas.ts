// lib/validations/import.schemas.ts
// Import 관련 Zod 스키마 정의

import { z } from 'zod';

const RA_VENUE_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/clubs\/\d+/;

/**
 * POST /api/import/venue/preview - Preview 요청
 */
export const venueImportPreviewSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_VENUE_URL_REGEX,
            'Invalid RA venue URL. Expected format: https://ra.co/clubs/{id}'
        ),
});

/**
 * POST /api/import/venue/confirm - Confirm 요청
 */
export const venueImportConfirmSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_VENUE_URL_REGEX,
            'Invalid RA venue URL. Expected format: https://ra.co/clubs/{id}'
        ),
    options: z
        .object({
            maxEvents: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
});

export type VenueImportPreviewInput = z.infer<typeof venueImportPreviewSchema>;
export type VenueImportConfirmInput = z.infer<typeof venueImportConfirmSchema>;
