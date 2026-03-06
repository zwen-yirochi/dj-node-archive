/**
 * Menu system configuration
 *
 * 통합 패턴: actionKey(string) + handler map + confirm strategy
 * - config는 "무엇을 보여줄지"와 "확인 전략"을 선언
 * - 소비자가 "actionKey → 콜백" 매핑을 제공
 * - confirm이 있으면 모달 확인 후 handler 실행
 */

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import type { EntryType } from './entryConfig';

// ============================================
// Confirm strategy
// ============================================

export type ConfirmStrategy =
    | { type: 'simple'; title: string; description: string; confirmLabel?: string }
    | {
          type: 'type-to-confirm';
          title: string;
          description: string;
          matchField: string;
          confirmLabel?: string;
      };

// ============================================
// 공통 메뉴 아이템 타입
// ============================================

export interface MenuItemConfig {
    actionKey: string;
    label: string;
    variant?: 'danger';
    /** 렌더 시점에 label을 동적으로 결정 (예: isVisible → "Hide"/"Show") */
    dynamicLabel?: (ctx: Record<string, unknown>) => string;
    /** 액션 실행 전 확인 모달 전략. 함수면 entry 상태에 따라 동적 결정. 없으면 즉시 실행 */
    confirm?: ConfirmStrategy | ((ctx: Record<string, unknown>) => ConfirmStrategy | undefined);
}

export interface MenuSeparatorConfig {
    type: 'separator';
}

export type MenuConfig = (MenuItemConfig | MenuSeparatorConfig)[];

// ============================================
// 공통 리졸버
// ============================================

/** handler map에서 actionKey로 콜백을 찾아 DropdownMenuItemConfig로 변환 */
export function resolveMenuItems(
    items: MenuConfig,
    handlers: Record<string, () => void>,
    ctx?: Record<string, unknown>
): DropdownMenuItemConfig[] {
    return items.map((item) => {
        if ('type' in item) return item;
        return {
            label: (ctx && item.dynamicLabel?.(ctx)) ?? item.label,
            variant: item.variant,
            onClick: handlers[item.actionKey],
        };
    });
}

/** config에서 confirm이 있는 MenuItemConfig만 추출 */
export function getConfirmableItems(items: MenuConfig): MenuItemConfig[] {
    return items.filter((item): item is MenuItemConfig => !('type' in item) && !!item.confirm);
}

// ============================================
// Confirm presets
// ============================================

const SIMPLE_DELETE_CONFIRM: ConfirmStrategy = {
    type: 'simple',
    title: 'Delete this entry?',
    description: 'This action cannot be undone.',
};

const TYPE_TO_CONFIRM_DELETE: ConfirmStrategy = {
    type: 'type-to-confirm',
    title: 'Delete this event?',
    description: 'Type the event title to confirm deletion.',
    matchField: 'title',
};

/** Public event → type-to-confirm, otherwise simple */
const EVENT_DELETE_CONFIRM = (ctx: Record<string, unknown>) =>
    ctx.eventId ? TYPE_TO_CONFIRM_DELETE : SIMPLE_DELETE_CONFIRM;

// ============================================
// Editor menu item constants
// ============================================

const SEPARATOR: MenuSeparatorConfig = { type: 'separator' };

const DELETE_SIMPLE: MenuItemConfig = {
    actionKey: 'delete',
    label: 'Delete',
    variant: 'danger',
    confirm: SIMPLE_DELETE_CONFIRM,
};
const DELETE_EVENT: MenuItemConfig = {
    actionKey: 'delete',
    label: 'Delete',
    variant: 'danger',
    confirm: EVENT_DELETE_CONFIRM,
};

// ============================================
// Per-type editor menu composition
// ============================================

export const EDITOR_MENU_CONFIG: Record<EntryType, MenuConfig> = {
    event: [DELETE_EVENT],
    mixset: [DELETE_SIMPLE],
    link: [DELETE_SIMPLE],
    custom: [DELETE_SIMPLE],
};

// ============================================
// Tree item menu constants
// ============================================

const TREE_EDIT: MenuItemConfig = { actionKey: 'edit', label: 'Edit' };
const TREE_DELETE: MenuItemConfig = {
    actionKey: 'delete',
    label: 'Delete',
    variant: 'danger',
    confirm: EVENT_DELETE_CONFIRM,
};
const TREE_TOGGLE_VISIBILITY: MenuItemConfig = {
    actionKey: 'toggle-visibility',
    label: 'Hide',
    dynamicLabel: (ctx) => (ctx.isVisible ? 'Hide' : 'Show'),
};
const TREE_REMOVE_FROM_PAGE: MenuItemConfig = {
    actionKey: 'remove-from-page',
    label: 'Remove from Page',
};

/** Component section: Edit / Delete */
export const TREE_ENTRY_MENU: MenuConfig = [TREE_EDIT, SEPARATOR, TREE_DELETE];

/** Page display section: Edit / Hide / Remove from Page */
export const TREE_PAGE_DISPLAY_MENU: MenuConfig = [
    TREE_EDIT,
    TREE_TOGGLE_VISIBILITY,
    TREE_REMOVE_FROM_PAGE,
    SEPARATOR,
    TREE_DELETE,
];
