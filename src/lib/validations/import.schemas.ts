// lib/validations/import.schemas.ts
// Import 관련 Zod 스키마 정의

import { z } from 'zod';

export const RA_VENUE_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/clubs\/\d+/;

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

export const RA_ARTIST_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/dj\/[\w-]+/;
export const RA_EVENT_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/events\/\d+/;

/** POST /api/import/artist/preview */
export const artistImportPreviewSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_ARTIST_URL_REGEX,
            'Invalid RA artist URL. Expected format: https://ra.co/dj/{name}'
        ),
});

/** POST /api/import/artist/confirm */
export const artistImportConfirmSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_ARTIST_URL_REGEX,
            'Invalid RA artist URL. Expected format: https://ra.co/dj/{name}'
        ),
    page_id: z.string().uuid('Invalid page ID'),
});

/** POST /api/import/event */
export const singleEventImportSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_EVENT_URL_REGEX,
            'Invalid RA event URL. Expected format: https://ra.co/events/{id}'
        ),
    page_id: z.string().uuid('Invalid page ID'),
});

export type ArtistImportPreviewInput = z.infer<typeof artistImportPreviewSchema>;
export type ArtistImportConfirmInput = z.infer<typeof artistImportConfirmSchema>;
export type SingleEventImportInput = z.infer<typeof singleEventImportSchema>;
