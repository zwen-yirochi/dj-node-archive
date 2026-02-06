import { COMPONENT_FIELDS, type EntryType } from '@/app/dashboard/entries/entryFields';
import type { ContentEntry } from '@/types';
import type { FieldConfig, TreeItemStatus, ValidationResult } from '@/types/entryFields';

// ============================================
// 내부 헬퍼 함수
// ============================================

/**
 * URL 형식 검증
 */
function isValidUrl(url: string): boolean {
    if (!url?.trim()) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * 단일 필드 값 검증
 */
function validateFieldValue(value: unknown, config: FieldConfig): boolean {
    if (value === undefined || value === null) return false;

    if (typeof value === 'string') {
        if (!value.trim()) return false;
        if (config.isUrl && !isValidUrl(value)) return false;
        return true;
    }

    if (Array.isArray(value)) {
        return config.allowEmptyArray || value.length > 0;
    }

    return true;
}

// ============================================
// 필드 설정 헬퍼 함수
// ============================================

/**
 * 특정 검증 단계에서 필수인 필드 목록 반환
 */
export function getRequiredFields(type: EntryType, tier: 'create' | 'view'): FieldConfig[] {
    const fields = COMPONENT_FIELDS[type];

    if (tier === 'create') {
        return fields.filter((f) => f.required === 'create');
    }

    // view 단계: create + view 필드 모두 필수
    return fields.filter((f) => f.required === 'create' || f.required === 'view');
}

/**
 * 필드가 특정 단계에서 필수인지 확인
 */
export function isFieldRequired(
    type: EntryType,
    fieldKey: string,
    tier: 'create' | 'view'
): boolean {
    const fields = COMPONENT_FIELDS[type];
    const field = fields.find((f) => f.key === fieldKey);

    if (!field) return false;

    if (tier === 'create') {
        return field.required === 'create';
    }

    return field.required === 'create' || field.required === 'view';
}

/**
 * 필드 설정 가져오기
 */
export function getFieldConfig(type: EntryType, fieldKey: string): FieldConfig | undefined {
    return COMPONENT_FIELDS[type].find((f) => f.key === fieldKey);
}

// ============================================
// 검증 함수
// ============================================

/**
 * 엔트리 검증 (범용)
 *
 * @param entry - 검증할 엔트리
 * @param tier - 검증 단계 ('create' | 'view')
 */
export function validateEntry(
    entry: ContentEntry,
    tier: 'create' | 'view' = 'view'
): ValidationResult {
    const type = entry.type as EntryType;
    const requiredFields = getRequiredFields(type, tier);

    const errors: string[] = [];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
        const value = (entry as unknown as Record<string, unknown>)[field.key];
        const isValid = validateFieldValue(value, field);

        if (!isValid) {
            missingFields.push(field.key);
            if (field.isUrl && value && typeof value === 'string' && value.trim()) {
                errors.push(`${field.label}: 유효한 URL 형식이 아닙니다`);
            } else {
                errors.push(`${field.label}이(가) 필요합니다`);
            }
        }
    }

    // Mixset 특수 케이스: audioUrl 또는 soundcloudEmbedUrl 중 하나 필요
    if (type === 'mixset' && tier === 'view') {
        const mixset = entry as unknown as Record<string, unknown>;
        const hasAudio =
            mixset.audioUrl && typeof mixset.audioUrl === 'string' && mixset.audioUrl.trim();
        const hasSoundcloud =
            mixset.soundcloudEmbedUrl &&
            typeof mixset.soundcloudEmbedUrl === 'string' &&
            mixset.soundcloudEmbedUrl.trim();

        if (!hasAudio && !hasSoundcloud) {
            missingFields.push('audioUrl');
            errors.push('오디오 URL 또는 SoundCloud 임베드 URL이 필요합니다');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        missingFields,
    };
}

/** @deprecated Use validateEntry instead */
export const validateComponent = validateEntry;

/**
 * 엔트리 생성 가능 여부 확인 (Tier 1)
 * - title만 필수
 */
export function canCreate(entry: ContentEntry): boolean {
    return validateEntry(entry, 'create').isValid;
}

/**
 * 엔트리가 Page에 추가 가능한지 확인 (Tier 2)
 * - title + 추가 필수 필드 (coverUrl, url 등)
 */
export function canAddToView(entry: ContentEntry): boolean {
    return validateEntry(entry, 'view').isValid;
}

// ============================================
// UI 헬퍼 함수
// ============================================

/**
 * 엔트리 완성도 계산 (0-100%)
 * Page 사용 가능 기준으로 계산
 */
export function getCompletionPercentage(entry: ContentEntry): number {
    const type = entry.type as EntryType;
    const requiredFields = getRequiredFields(type, 'view');

    if (requiredFields.length === 0) return 100;

    let filledCount = 0;
    for (const field of requiredFields) {
        const value = (entry as unknown as Record<string, unknown>)[field.key];
        if (validateFieldValue(value, field)) {
            filledCount++;
        }
    }

    return Math.round((filledCount / requiredFields.length) * 100);
}

/**
 * 누락된 필드 목록과 라벨 반환
 */
export function getMissingFieldLabels(
    entry: ContentEntry,
    tier: 'create' | 'view' = 'view'
): string[] {
    const type = entry.type as EntryType;
    const fields = COMPONENT_FIELDS[type];
    const result = validateEntry(entry, tier);

    return result.missingFields
        .map((key) => fields.find((f) => f.key === key)?.label)
        .filter((label): label is string => !!label);
}

/**
 * TreeItem 상태 계산
 * @param isInView - 컴포넌트가 현재 View에 있는지
 * @param isValid - 컴포넌트가 view tier 검증을 통과하는지
 */
export function getTreeItemStatus(isInView: boolean, isValid: boolean): TreeItemStatus {
    if (isInView) return 'inView';
    if (!isValid) return 'warning';
    return 'normal';
}
