/**
 * 미리보기 트리거 유틸리티
 *
 * 컴포넌트 변경 시 공개 페이지에 영향을 주는 필드만
 * 미리보기 새로고침을 트리거하도록 중앙 관리합니다.
 */

import { COMPONENT_FIELDS, type EntryType } from '@/constants/entries/entryFields';
import type { ContentEntry } from '@/types';

/**
 * 두 값이 같은지 깊은 비교
 */
function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, i) => isEqual(item, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a as object);
        const keysB = Object.keys(b as object);
        if (keysA.length !== keysB.length) return false;
        return keysA.every((key) =>
            isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        );
    }

    return false;
}

/**
 * 변경된 필드 중 미리보기 트리거가 필요한 필드가 있는지 확인
 *
 * @param previousEntry - 변경 전 엔트리
 * @param updatedEntry - 변경 후 엔트리
 * @returns 미리보기 새로고침이 필요하면 true
 */
export function shouldTriggerPreview(
    previousEntry: ContentEntry,
    updatedEntry: ContentEntry
): boolean {
    const type = updatedEntry.type as EntryType;
    const fields = COMPONENT_FIELDS[type];

    if (!fields) return false;

    for (const field of fields) {
        // triggersPreview가 false인 필드는 건너뜀
        if (!field.triggersPreview) continue;

        const prevValue = (previousEntry as unknown as Record<string, unknown>)[field.key];
        const newValue = (updatedEntry as unknown as Record<string, unknown>)[field.key];

        // 값이 다르면 트리거 필요
        if (!isEqual(prevValue, newValue)) {
            return true;
        }
    }

    return false;
}

/**
 * 특정 필드가 미리보기를 트리거하는지 확인
 *
 * @param type - 컴포넌트 타입
 * @param fieldKey - 필드 키
 * @returns 해당 필드가 미리보기를 트리거하면 true
 */
export function doesFieldTriggerPreview(type: EntryType, fieldKey: string): boolean {
    const fields = COMPONENT_FIELDS[type];
    const field = fields?.find((f) => f.key === fieldKey);
    return field?.triggersPreview ?? false;
}

/**
 * 미리보기를 트리거하는 필드 목록 반환
 *
 * @param type - 컴포넌트 타입
 * @returns triggersPreview가 true인 필드 키 목록
 */
export function getPreviewTriggerFields(type: EntryType): string[] {
    const fields = COMPONENT_FIELDS[type];
    return fields?.filter((f) => f.triggersPreview).map((f) => f.key) ?? [];
}
