/**
 * Field Sync Configs — 필드별 저장 전략의 단일 소스
 *
 * 각 필드 타입의 FieldSync 설정(immediate/debounce + schema)을 정의한다.
 * UnifiedDetailView와 custom-blocks 모두 이 설정을 import한다.
 */

import { z } from 'zod';

import type { ArtistReference, TracklistItem, VenueReference } from '@/types';
import { urlStrictAtom, venueReferenceSchema } from '@/lib/validations/field.atoms';

import type { FieldSyncConfig } from './FieldSync';
import type { ImageItem } from './types';

// ============================================
// Text fields (debounced)
// ============================================

export const TEXT_FIELD_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

// ============================================
// Discrete action fields (immediate)
// ============================================

export const DATE_FIELD_CONFIG: FieldSyncConfig<string> = {
    immediate: true,
    schema: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .or(z.literal('')),
};

export const URL_FIELD_CONFIG: FieldSyncConfig<string> = {
    immediate: true,
    schema: urlStrictAtom.or(z.literal('')),
};

export const ICON_FIELD_CONFIG: FieldSyncConfig<string> = { immediate: true };
export const IMAGE_FIELD_CONFIG: FieldSyncConfig<ImageItem[]> = { immediate: true };
export const LINEUP_FIELD_CONFIG: FieldSyncConfig<ArtistReference[]> = { immediate: true };

// ============================================
// Complex fields (debounced)
// ============================================

export const VENUE_FIELD_CONFIG: FieldSyncConfig<VenueReference> = {
    debounceMs: 800,
    schema: venueReferenceSchema.or(z.object({ name: z.literal('') })),
};

export const TRACKLIST_FIELD_CONFIG: FieldSyncConfig<TracklistItem[]> = { debounceMs: 800 };
