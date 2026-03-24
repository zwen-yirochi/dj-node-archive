/**
 * Entry validation — Zod schema registry + validation helpers
 */

import type { ZodSchema } from 'zod';

import type { ContentEntry } from '@/types';
import {
    draftCustomSchema,
    draftEventSchema,
    draftLinkSchema,
    draftMixsetSchema,
    publishCustomSchema,
    publishEventSchema,
    publishLinkSchema,
    publishMixsetSchema,
} from '@/lib/validations/entry.schemas';

import { FIELD_CONFIG, type FieldConfig } from './entry-fields';
import type { EntryType } from './entry-types';

// ============================================
// Schema registry
// ============================================

export const ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }> = {
    event: { create: draftEventSchema, view: publishEventSchema },
    mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
    link: { create: draftLinkSchema, view: publishLinkSchema },
    custom: { create: draftCustomSchema, view: publishCustomSchema },
};

// ============================================
// Validation helpers
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    missingFields: string[];
}

export function validateEntry(
    entry: ContentEntry,
    tier: 'create' | 'view' = 'view'
): ValidationResult {
    const type: EntryType = entry.type;
    const schema = tier === 'create' ? ENTRY_SCHEMAS[type].create : ENTRY_SCHEMAS[type].view;
    const result = schema.safeParse(entry);

    if (result.success) {
        return { isValid: true, errors: [], missingFields: [] };
    }

    const fields = FIELD_CONFIG[type];
    const errors: string[] = [];
    const missingFields: string[] = [];

    for (const issue of result.error.issues) {
        const fieldKey = issue.path[0]?.toString() ?? '';
        if (!missingFields.includes(fieldKey)) {
            missingFields.push(fieldKey);
        }
        const label = fields.find((f: FieldConfig) => f.key === fieldKey)?.label ?? fieldKey;
        errors.push(`${label}: ${issue.message}`);
    }

    return { isValid: false, errors, missingFields };
}

export function canCreate(entry: ContentEntry): boolean {
    return validateEntry(entry, 'create').isValid;
}

export function canAddToView(entry: ContentEntry): boolean {
    return validateEntry(entry, 'create').isValid;
}

export function getMissingFieldLabels(
    entry: ContentEntry,
    tier: 'create' | 'view' = 'view'
): string[] {
    const type: EntryType = entry.type;
    const fields = FIELD_CONFIG[type];
    const result = validateEntry(entry, tier);
    return result.missingFields
        .map((key) => fields.find((f: FieldConfig) => f.key === key)?.label)
        .filter((label): label is string => !!label);
}
