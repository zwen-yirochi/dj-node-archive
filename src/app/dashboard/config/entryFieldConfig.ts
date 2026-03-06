/**
 * Entry field configuration — single responsibility: "what fields does each type have and what rules apply"
 *
 * 1. Field metadata (key, label, triggersPreview)
 * 2. Schema registry (create/view tier -> Zod schema mapping)
 * 3. Entry completeness helpers (canAddToView, getTreeItemStatus, etc.)
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

import type { EntryType } from './entryConfig';

// ============================================
// Field metadata
// ============================================

export interface FieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean;
}

export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'date', label: 'Date', triggersPreview: true },
        { key: 'venue', label: 'Venue', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'lineup', label: 'Lineup', triggersPreview: true },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    mixset: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'tracklist', label: 'Tracklist', triggersPreview: false },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    link: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'icon', label: 'Icon', triggersPreview: true },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    custom: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'blocks', label: 'Blocks', triggersPreview: true },
    ],
};

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
// Entry completeness helpers
// ============================================

export type TreeItemStatus = 'inView' | 'normal' | 'warning';

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
        const label = fields.find((f) => f.key === fieldKey)?.label ?? fieldKey;
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
        .map((key) => fields.find((f) => f.key === key)?.label)
        .filter((label): label is string => !!label);
}

export function getTreeItemStatus(isInView: boolean, isValid: boolean): TreeItemStatus {
    if (isInView) return 'inView';
    if (!isValid) return 'warning';
    return 'normal';
}
