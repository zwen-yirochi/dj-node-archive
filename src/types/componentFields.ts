/**
 * 컴포넌트 필드 검증 타입 정의
 */

/** 검증 단계 */
export type ValidationTier = 'create' | 'view' | false;

/** 필드 설정 */
export interface FieldConfig {
    /** 필드 키 (컴포넌트 객체의 프로퍼티명) */
    key: string;
    /** 폼에서 표시할 라벨 */
    label: string;
    /** 검증 단계: 'create' = 생성 시 필수, 'view' = Page 추가 시 필수, false = 선택 */
    required: ValidationTier;
    /** URL 형식 검증 필요 여부 */
    isUrl?: boolean;
    /** 빈 배열 허용 여부 (배열 필드용) */
    allowEmptyArray?: boolean;
}

/** 검증 결과 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    /** 누락된 필드 키 목록 */
    missingFields: string[];
}

/** TreeItem 상태 (우측 아이콘 표시용) */
export type TreeItemStatus = 'inView' | 'normal' | 'warning';
