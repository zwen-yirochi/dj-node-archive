import type { ContentEntry, EventComponent, LinkComponent, MixsetComponent } from './domain';

/**
 * ContentEntry 타입 가드 함수들
 * as 캐스팅 대신 타입 가드를 사용하여 타입 안전성 확보
 */

export function isEventComponent(entry: ContentEntry): entry is EventComponent {
    return entry.type === 'event';
}

export function isMixsetComponent(entry: ContentEntry): entry is MixsetComponent {
    return entry.type === 'mixset';
}

export function isLinkComponent(entry: ContentEntry): entry is LinkComponent {
    return entry.type === 'link';
}

/**
 * 엔트리 타입별 라벨 반환
 */
export function getEntryTypeLabel(entry: ContentEntry): string {
    if (isEventComponent(entry)) return 'Event';
    if (isMixsetComponent(entry)) return 'Mixset';
    if (isLinkComponent(entry)) return 'Link';
    return 'Unknown';
}

/** @deprecated Use getEntryTypeLabel instead */
export const getComponentTypeLabel = getEntryTypeLabel;
