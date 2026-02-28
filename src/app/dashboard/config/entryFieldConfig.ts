/**
 * 엔트리 필드 설정 — 단일 책임: "각 타입의 필드는 무엇이고 어떤 규칙을 가지는가"
 *
 * 1. 필드 메타데이터 (key, label, triggersPreview)
 * 2. 스키마 레지스트리 (create/view tier → Zod 스키마 매핑)
 * 3. 엔트리 완성도 헬퍼 (canAddToView, getTreeItemStatus 등)
 */

import type { ZodSchema } from 'zod';

import type { ContentEntry } from '@/types';
import {
    draftEventSchema,
    draftLinkSchema,
    draftMixsetSchema,
    publishEventSchema,
    publishLinkSchema,
    publishMixsetSchema,
} from '@/lib/validations/entry.schemas';

import type { EntryType } from './entryConfig';

// ============================================
// 필드 메타데이터
// ============================================

export interface FieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean;
}

export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: '제목', triggersPreview: true },
        { key: 'date', label: '날짜', triggersPreview: true },
        { key: 'venue', label: '장소', triggersPreview: true },
        { key: 'posterUrl', label: '포스터 이미지', triggersPreview: true },
        { key: 'lineup', label: '라인업', triggersPreview: true },
        { key: 'description', label: '설명', triggersPreview: false },
        { key: 'links', label: '링크', triggersPreview: false },
    ],
    mixset: [
        { key: 'title', label: '제목', triggersPreview: true },
        { key: 'coverUrl', label: '커버 이미지', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'tracklist', label: '트랙리스트', triggersPreview: false },
        { key: 'description', label: '설명', triggersPreview: false },
    ],
    link: [
        { key: 'title', label: '제목', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'icon', label: '아이콘', triggersPreview: true },
    ],
};

// ============================================
// 스키마 레지스트리
// ============================================

export const ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }> = {
    event: { create: draftEventSchema, view: publishEventSchema },
    mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
    link: { create: draftLinkSchema, view: publishLinkSchema },
};

// ============================================
// 엔트리 완성도 헬퍼
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
