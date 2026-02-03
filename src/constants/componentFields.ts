/**
 * 컴포넌트 필드 설정 - Single Source of Truth
 *
 * 검증 단계:
 * - 'create': 컴포넌트 생성 시 필수 (title)
 * - 'view': 페이지에 추가할 때 필수 (cover, url 등)
 * - false: 선택 사항
 */

export type ValidationTier = 'create' | 'view' | false;

export interface FieldConfig {
    /** 필드 키 (컴포넌트 객체의 프로퍼티명) */
    key: string;
    /** 폼에서 표시할 라벨 */
    label: string;
    /** 검증 단계 */
    required: ValidationTier;
    /** URL 형식 검증 필요 여부 */
    isUrl?: boolean;
    /** 빈 배열 허용 여부 (배열 필드용) */
    allowEmptyArray?: boolean;
}

// ============================================
// Event (Show) 컴포넌트 필드 설정
// ============================================
export const EVENT_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create' },
    { key: 'date', label: '날짜', required: 'create' },
    { key: 'venue', label: '장소', required: false },
    { key: 'posterUrl', label: '포스터 이미지', required: 'view', isUrl: true },
    { key: 'lineup', label: '라인업', required: false, allowEmptyArray: true },
    { key: 'description', label: '설명', required: false },
    { key: 'links', label: '링크', required: false, allowEmptyArray: true },
];

// ============================================
// Mixset 컴포넌트 필드 설정
// ============================================
export const MIXSET_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create' },
    { key: 'coverUrl', label: '커버 이미지', required: 'view', isUrl: true },
    {
        key: 'audioUrl',
        label: '오디오 URL',
        required: false, // soundcloudEmbedUrl과 OR 조건
        isUrl: true,
    },
    {
        key: 'soundcloudEmbedUrl',
        label: 'SoundCloud 임베드',
        required: false, // audioUrl과 OR 조건
        isUrl: true,
    },
    { key: 'tracklist', label: '트랙리스트', required: false, allowEmptyArray: true },
    { key: 'description', label: '설명', required: false },
    { key: 'releaseDate', label: '발매일', required: false },
    { key: 'genre', label: '장르', required: false },
];

// ============================================
// Link 컴포넌트 필드 설정
// ============================================
export const LINK_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create' },
    { key: 'url', label: 'URL', required: 'view', isUrl: true },
    { key: 'icon', label: '아이콘', required: false },
];

// ============================================
// 타입별 필드 설정 맵
// ============================================
export const COMPONENT_FIELDS = {
    show: EVENT_FIELDS,
    mixset: MIXSET_FIELDS,
    link: LINK_FIELDS,
} as const;

export type ComponentType = keyof typeof COMPONENT_FIELDS;

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 특정 검증 단계에서 필수인 필드 목록 반환
 */
export function getRequiredFields(type: ComponentType, tier: 'create' | 'view'): FieldConfig[] {
    const fields = COMPONENT_FIELDS[type];

    if (tier === 'create') {
        // 생성 시 필수 필드만
        return fields.filter((f) => f.required === 'create');
    }

    // view 단계: create + view 필드 모두 필수
    return fields.filter((f) => f.required === 'create' || f.required === 'view');
}

/**
 * 필드가 특정 단계에서 필수인지 확인
 */
export function isFieldRequired(
    type: ComponentType,
    fieldKey: string,
    tier: 'create' | 'view'
): boolean {
    const fields = COMPONENT_FIELDS[type];
    const field = fields.find((f) => f.key === fieldKey);

    if (!field) return false;

    if (tier === 'create') {
        return field.required === 'create';
    }

    // view 단계: create 또는 view 필수
    return field.required === 'create' || field.required === 'view';
}

/**
 * 필드 설정 가져오기
 */
export function getFieldConfig(type: ComponentType, fieldKey: string): FieldConfig | undefined {
    return COMPONENT_FIELDS[type].find((f) => f.key === fieldKey);
}
