/**
 * 컴포넌트 필드 설정 - Single Source of Truth
 *
 * 검증 단계:
 * - 'create': 컴포넌트 생성 시 필수 (title)
 * - 'view': 페이지에 추가할 때 필수 (cover, url 등)
 * - false: 선택 사항
 */

import type { FieldConfig } from '@/types/componentFields';

// ============================================
// Event (Show) 컴포넌트 필드 설정
// ============================================
export const EVENT_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create', triggersPreview: true },
    { key: 'date', label: '날짜', required: 'create', triggersPreview: true },
    { key: 'venue', label: '장소', required: false, triggersPreview: true },
    {
        key: 'posterUrl',
        label: '포스터 이미지',
        required: 'view',
        isUrl: true,
        triggersPreview: true,
    },
    {
        key: 'lineup',
        label: '라인업',
        required: false,
        allowEmptyArray: true,
        triggersPreview: true,
    },
    { key: 'description', label: '설명', required: false, triggersPreview: false }, // 공개 페이지 미표시
    { key: 'links', label: '링크', required: false, allowEmptyArray: true, triggersPreview: false }, // 공개 페이지 미표시
];

// ============================================
// Mixset 컴포넌트 필드 설정
// ============================================
export const MIXSET_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create', triggersPreview: true },
    { key: 'coverUrl', label: '커버 이미지', required: 'view', isUrl: true, triggersPreview: true },
    {
        key: 'audioUrl',
        label: '오디오 URL',
        required: false, // soundcloudEmbedUrl과 OR 조건 (validators.ts에서 처리)
        isUrl: true,
        triggersPreview: true,
    },
    {
        key: 'soundcloudEmbedUrl',
        label: 'SoundCloud 임베드',
        required: false, // audioUrl과 OR 조건
        isUrl: true,
        triggersPreview: true,
    },
    {
        key: 'tracklist',
        label: '트랙리스트',
        required: false,
        allowEmptyArray: true,
        triggersPreview: false,
    }, // 공개 페이지 미표시
    { key: 'description', label: '설명', required: false, triggersPreview: false }, // 공개 페이지 미표시
    { key: 'releaseDate', label: '발매일', required: false, triggersPreview: true },
    { key: 'genre', label: '장르', required: false, triggersPreview: true },
];

// ============================================
// Link 컴포넌트 필드 설정
// ============================================
export const LINK_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create', triggersPreview: true },
    { key: 'url', label: 'URL', required: 'view', isUrl: true, triggersPreview: true },
    { key: 'icon', label: '아이콘', required: false, triggersPreview: true },
];

// ============================================
// 타입별 필드 설정 맵
// ============================================
export const COMPONENT_FIELDS = {
    event: EVENT_FIELDS,
    mixset: MIXSET_FIELDS,
    link: LINK_FIELDS,
} as const;

export type ComponentType = keyof typeof COMPONENT_FIELDS;
