import type { FieldSyncConfig } from './FieldSync';
import type { ImageItem } from './types';

/** 이미지 필드 공통 설정 — immediate 저장 (업로드 즉시 반영) */
export const IMAGE_FIELD_CONFIG: FieldSyncConfig<ImageItem[]> = {
    immediate: true,
};
