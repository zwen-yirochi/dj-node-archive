import {
    COMPONENT_FIELDS,
    getRequiredFields,
    type ComponentType,
    type FieldConfig,
} from '@/constants/componentFields';
import type { ComponentData } from '@/types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    /** 누락된 필드 키 목록 */
    missingFields: string[];
}

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
    // 빈 값 체크
    if (value === undefined || value === null) return false;

    if (typeof value === 'string') {
        if (!value.trim()) return false;
        // URL 검증
        if (config.isUrl && !isValidUrl(value)) return false;
        return true;
    }

    if (Array.isArray(value)) {
        // 빈 배열 허용 여부
        return config.allowEmptyArray || value.length > 0;
    }

    return true;
}

/**
 * 컴포넌트 검증 (범용)
 *
 * @param component - 검증할 컴포넌트
 * @param tier - 검증 단계 ('create' | 'view')
 */
export function validateComponent(
    component: ComponentData,
    tier: 'create' | 'view' = 'view'
): ValidationResult {
    const type = component.type as ComponentType;
    const requiredFields = getRequiredFields(type, tier);

    const errors: string[] = [];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
        const value = (component as unknown as Record<string, unknown>)[field.key];
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
        const mixset = component as unknown as Record<string, unknown>;
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

/**
 * 컴포넌트 생성 가능 여부 확인 (Tier 1)
 * - title만 필수
 */
export function canCreate(component: ComponentData): boolean {
    return validateComponent(component, 'create').isValid;
}

/**
 * 컴포넌트가 Page에 추가 가능한지 확인 (Tier 2)
 * - title + 추가 필수 필드 (coverUrl, url 등)
 */
export function canAddToView(component: ComponentData): boolean {
    return validateComponent(component, 'view').isValid;
}

/**
 * 컴포넌트 완성도 계산 (0-100%)
 * Page 사용 가능 기준으로 계산
 */
export function getCompletionPercentage(component: ComponentData): number {
    const type = component.type as ComponentType;
    const requiredFields = getRequiredFields(type, 'view');

    if (requiredFields.length === 0) return 100;

    let filledCount = 0;
    for (const field of requiredFields) {
        const value = (component as unknown as Record<string, unknown>)[field.key];
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
    component: ComponentData,
    tier: 'create' | 'view' = 'view'
): string[] {
    const type = component.type as ComponentType;
    const fields = COMPONENT_FIELDS[type];
    const result = validateComponent(component, tier);

    return result.missingFields
        .map((key) => fields.find((f) => f.key === key)?.label)
        .filter((label): label is string => !!label);
}
