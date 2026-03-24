import type { ComponentType } from 'react';

import { GalleryHorizontal, List, Sparkles } from 'lucide-react';

import type { ViewType } from '@/types/domain';

export interface ViewTypeOption {
    value: ViewType;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

/** Carousel ↔ List 전환 가능한 뷰 타입 */
export const CONVERTIBLE_VIEW_TYPES: ViewTypeOption[] = [
    { value: 'carousel', label: 'Carousel', icon: GalleryHorizontal },
    { value: 'list', label: 'List', icon: List },
];

/** Feature — 독립 타입, 다른 뷰로 전환 불가 */
export const FEATURE_VIEW_TYPE: ViewTypeOption = {
    value: 'feature',
    label: 'Feature',
    icon: Sparkles,
};

/** 섹션 추가 시 선택 가능한 전체 목록 */
export const ALL_VIEW_TYPE_OPTIONS: ViewTypeOption[] = [
    ...CONVERTIBLE_VIEW_TYPES,
    FEATURE_VIEW_TYPE,
];
