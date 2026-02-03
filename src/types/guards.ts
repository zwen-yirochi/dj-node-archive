import type { ComponentData, EventComponent, LinkComponent, MixsetComponent } from './domain';

/**
 * ComponentData 타입 가드 함수들
 * as 캐스팅 대신 타입 가드를 사용하여 타입 안전성 확보
 */

export function isEventComponent(component: ComponentData): component is EventComponent {
    return component.type === 'show';
}

export function isMixsetComponent(component: ComponentData): component is MixsetComponent {
    return component.type === 'mixset';
}

export function isLinkComponent(component: ComponentData): component is LinkComponent {
    return component.type === 'link';
}

/**
 * 컴포넌트 타입별 라벨 반환
 */
export function getComponentTypeLabel(component: ComponentData): string {
    if (isEventComponent(component)) return 'Event';
    if (isMixsetComponent(component)) return 'Mixset';
    if (isLinkComponent(component)) return 'Link';
    return 'Unknown';
}
