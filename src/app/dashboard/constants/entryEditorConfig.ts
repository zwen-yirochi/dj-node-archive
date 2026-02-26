/**
 * 에디터 행동 설정 (fields, triggersPreview, menuItems)
 */

import { ImageIcon, Trash2, Type } from 'lucide-react';
import type { EntryEditorConfig, EditorMenuItemConfig } from '@/types/entryFields';
import type { EntryType } from './entryConfig';

// ============================================
// 공유 메뉴 아이템 상수
// ============================================

const EDIT_TITLE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'title' },
    label: '제목 변경',
    icon: Type,
};
const EDIT_IMAGE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'image' },
    label: '이미지 변경',
    icon: ImageIcon,
};
const SEPARATOR: EditorMenuItemConfig = { type: 'separator' };
const DELETE: EditorMenuItemConfig = {
    action: { type: 'delete' },
    label: '삭제',
    icon: Trash2,
    variant: 'danger',
};

// ============================================
// 타입별 에디터 설정
// ============================================

export const EDITOR_CONFIG: Record<EntryType, EntryEditorConfig> = {
    event: {
        fields: [
            { key: 'title', label: '제목', triggersPreview: true },
            { key: 'date', label: '날짜', triggersPreview: true },
            { key: 'venue', label: '장소', triggersPreview: true },
            { key: 'posterUrl', label: '포스터 이미지', triggersPreview: true },
            { key: 'lineup', label: '라인업', triggersPreview: true },
            { key: 'description', label: '설명', triggersPreview: false },
            { key: 'links', label: '링크', triggersPreview: false },
        ],
        menuItems: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    },
    mixset: {
        fields: [
            { key: 'title', label: '제목', triggersPreview: true },
            { key: 'coverUrl', label: '커버 이미지', triggersPreview: true },
            { key: 'audioUrl', label: '오디오 URL', triggersPreview: true },
            { key: 'soundcloudEmbedUrl', label: 'SoundCloud 임베드', triggersPreview: true },
            { key: 'tracklist', label: '트랙리스트', triggersPreview: false },
            { key: 'description', label: '설명', triggersPreview: false },
            { key: 'releaseDate', label: '발매일', triggersPreview: true },
            { key: 'genre', label: '장르', triggersPreview: true },
        ],
        menuItems: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    },
    link: {
        fields: [
            { key: 'title', label: '제목', triggersPreview: true },
            { key: 'url', label: 'URL', triggersPreview: true },
            { key: 'icon', label: '아이콘', triggersPreview: true },
        ],
        menuItems: [EDIT_TITLE, SEPARATOR, DELETE], // 이미지 없음
    },
};
