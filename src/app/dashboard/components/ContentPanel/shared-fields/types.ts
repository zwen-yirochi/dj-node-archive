import type { ComponentType } from 'react';

/** 모든 코어 필드 컴포넌트의 기본 props — 순수 UI, 저장 방식을 모름 */
export interface FieldComponentProps<T> {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}

/** 개별 이미지 항목 */
export interface ImageItem {
    id: string;
    url: string;
    alt?: string;
    caption?: string;
}

/** 이미지 필드 aspect ratio 옵션 */
export type ImageAspectRatio = 'video' | 'square' | 'portrait';

/** ImageField 전용 props — 멀티 이미지 지원 */
export interface ImageFieldProps extends FieldComponentProps<ImageItem[]> {
    maxCount?: number;
    aspectRatio?: ImageAspectRatio;
    placeholder?: {
        icon?: ComponentType<{ className?: string }>;
        text?: string;
    };
}
