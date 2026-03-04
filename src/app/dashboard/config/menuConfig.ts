/**
 * Menu system configuration
 *
 * 통합 패턴: actionKey(string) + handler map
 * - config는 "무엇을 보여줄지"만 선언 (actionKey, label, variant)
 * - 소비자가 "actionKey → 콜백" 매핑을 제공
 * - 새 액션 추가 = config에 항목 추가 + 소비자에 handler 추가 (2곳)
 */

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import type { EntryType } from './entryConfig';

// ============================================
// 공통 메뉴 아이템 타입
// ============================================

export interface MenuItemConfig {
    actionKey: string;
    label: string;
    variant?: 'danger';
    /** 렌더 시점에 label을 동적으로 결정 (예: isVisible → "Hide"/"Show") */
    dynamicLabel?: (ctx: Record<string, unknown>) => string;
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

// ============================================
// Editor menu item constants
// ============================================

const EDIT_TITLE: MenuItemConfig = { actionKey: 'edit-title', label: 'Edit title' };
const EDIT_IMAGE: MenuItemConfig = { actionKey: 'edit-image', label: 'Edit image' };
const DELETE: MenuItemConfig = { actionKey: 'delete', label: 'Delete', variant: 'danger' };
const SEPARATOR: MenuSeparatorConfig = { type: 'separator' };

// ============================================
// Per-type editor menu composition
// ============================================

export const EDITOR_MENU_CONFIG: Record<EntryType, MenuConfig> = {
    event: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    mixset: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    link: [EDIT_TITLE, SEPARATOR, DELETE],
    custom: [EDIT_TITLE, SEPARATOR, DELETE],
};

// ============================================
// Tree item menu constants
// ============================================

const TREE_EDIT: MenuItemConfig = { actionKey: 'edit', label: 'Edit' };
const TREE_DELETE: MenuItemConfig = { actionKey: 'delete', label: 'Delete', variant: 'danger' };
const TREE_TOGGLE_VISIBILITY: MenuItemConfig = {
    actionKey: 'toggle-visibility',
    label: 'Hide',
    dynamicLabel: (ctx) => (ctx.isVisible ? 'Hide' : 'Show'),
};
const TREE_REMOVE_FROM_PAGE: MenuItemConfig = {
    actionKey: 'remove-from-page',
    label: 'Remove from Page',
    variant: 'danger',
};

/** Component section: Edit / Delete */
export const TREE_ENTRY_MENU: MenuConfig = [TREE_EDIT, SEPARATOR, TREE_DELETE];

/** Page display section: Edit / Hide / Remove from Page */
export const TREE_PAGE_DISPLAY_MENU: MenuConfig = [
    TREE_EDIT,
    TREE_TOGGLE_VISIBILITY,
    SEPARATOR,
    TREE_REMOVE_FROM_PAGE,
];
