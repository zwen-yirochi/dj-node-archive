/**
 * 검증 규칙 설정 (필드별 create/view rule)
 *
 * create: 엔트리 생성 시 검증 규칙
 * view: 페이지에 추가할 때 검증 규칙
 * - 'required': 값이 필수
 * - 'url': URL 형식 검증
 * - false: 선택 사항
 */

import type { FieldValidationConfig } from '@/types/entryFields';
import type { EntryType } from './entryConfig';

export const VALIDATION_CONFIG: Record<EntryType, FieldValidationConfig[]> = {
    event: [
        { key: 'title', label: '제목', create: 'required', view: 'required' },
        { key: 'date', label: '날짜', create: 'required', view: 'required' },
        { key: 'venue', label: '장소', create: false, view: false },
        { key: 'posterUrl', label: '포스터 이미지', create: false, view: 'required', isUrl: true },
        { key: 'lineup', label: '라인업', create: false, view: false, allowEmptyArray: true },
        { key: 'description', label: '설명', create: false, view: false },
        { key: 'links', label: '링크', create: false, view: false, allowEmptyArray: true },
    ],
    mixset: [
        { key: 'title', label: '제목', create: 'required', view: 'required' },
        { key: 'coverUrl', label: '커버 이미지', create: false, view: 'required', isUrl: true },
        { key: 'audioUrl', label: '오디오 URL', create: false, view: false, isUrl: true },
        { key: 'soundcloudEmbedUrl', label: 'SoundCloud', create: false, view: false, isUrl: true },
        {
            key: 'tracklist',
            label: '트랙리스트',
            create: false,
            view: false,
            allowEmptyArray: true,
        },
        { key: 'description', label: '설명', create: false, view: false },
        { key: 'releaseDate', label: '발매일', create: false, view: false },
        { key: 'genre', label: '장르', create: false, view: false },
    ],
    link: [
        { key: 'title', label: '제목', create: 'required', view: 'required' },
        { key: 'url', label: 'URL', create: 'required', view: 'url', isUrl: true },
        { key: 'icon', label: '아이콘', create: false, view: false },
    ],
};
