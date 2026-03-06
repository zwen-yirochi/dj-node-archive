import type { ZodSchema } from 'zod';

/** 저장 옵션 — immediate 여부 */
export interface SaveOptions {
    immediate?: boolean;
}

/** FieldSync 설정 — 저장 전략 + 검증 */
export interface FieldSyncConfig<T> {
    /** true면 즉시 저장 (이미지, 토글 등), false/생략이면 디바운스 저장 (텍스트 등) */
    immediate?: boolean;
    schema?: ZodSchema;
    /** 디바운스 ms (immediate가 아닐 때만 사용, 기본 800) */
    debounceMs?: number;
}

/**
 * 모든 코어 필드 컴포넌트의 기본 props — 순수 UI, 저장 방식을 모름.
 * value/onChange는 SyncedField가 cloneElement로 주입하므로 optional이지만,
 * 런타임에서는 항상 존재한다.
 */
export interface FieldComponentProps<T> {
    value?: T;
    onChange?: (value: T) => void;
    disabled?: boolean;
}

/** 개별 이미지 항목 */
export interface ImageItem {
    id: string;
    url: string;
}

/** ImageField 전용 props — 멀티 이미지 지원 */
export interface ImageFieldProps extends FieldComponentProps<ImageItem[]> {
    maxCount?: number;
}
