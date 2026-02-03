import type {
    ComponentData,
    EventComponent,
    LinkComponent,
    MixsetComponent,
    isEventComponent,
    isLinkComponent,
    isMixsetComponent,
} from '@/types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * 이벤트 컴포넌트 유효성 검사
 */
export function validateEventComponent(component: EventComponent): ValidationResult {
    const errors: string[] = [];

    if (!component.title?.trim()) {
        errors.push('제목이 필요합니다');
    }
    if (!component.date) {
        errors.push('날짜가 필요합니다');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * 믹스셋 컴포넌트 유효성 검사
 */
export function validateMixsetComponent(component: MixsetComponent): ValidationResult {
    const errors: string[] = [];

    if (!component.title?.trim()) {
        errors.push('제목이 필요합니다');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * 링크 컴포넌트 유효성 검사
 */
export function validateLinkComponent(component: LinkComponent): ValidationResult {
    const errors: string[] = [];

    if (!component.title?.trim()) {
        errors.push('제목이 필요합니다');
    }
    if (!component.url?.trim()) {
        errors.push('URL이 필요합니다');
    } else {
        try {
            new URL(component.url);
        } catch {
            errors.push('유효한 URL 형식이 아닙니다');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * 컴포넌트 유효성 검사 (타입에 따라 분기)
 */
export function validateComponent(component: ComponentData): ValidationResult {
    switch (component.type) {
        case 'show':
            return validateEventComponent(component as EventComponent);
        case 'mixset':
            return validateMixsetComponent(component as MixsetComponent);
        case 'link':
            return validateLinkComponent(component as LinkComponent);
        default:
            return { isValid: false, errors: ['알 수 없는 컴포넌트 타입'] };
    }
}

/**
 * 컴포넌트가 Page에 추가 가능한지 확인
 */
export function canAddToView(component: ComponentData): boolean {
    return validateComponent(component).isValid;
}
