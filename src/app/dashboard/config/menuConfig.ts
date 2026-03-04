/**
 * Menu system configuration
 * - Declarative menu action types + resolver
 * - Per-type editor menu composition
 * - Tree item (sidebar) menu composition
 */

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import type { EntryType } from './entryConfig';

// ============================================
// Editor menu action types
// ============================================

/** Declarative menu action — extend the union and add a case to resolveAction when adding variants */
export type MenuAction =
    | { type: 'set-editing-field'; field: 'title' | 'image' }
    | { type: 'delete' };

export interface MenuActionItem {
    action: MenuAction;
    label: string;
    variant?: 'danger';
}

export interface MenuSeparatorConfig {
    type: 'separator';
}

export type EditorMenuItemConfig = MenuActionItem | MenuSeparatorConfig;

// ============================================
// Editor menu action resolution
// ============================================

/** Action context provided by the component */
export interface MenuActionContext {
    setEditingField: (field: 'title' | 'image' | null) => void;
    onDelete: () => void;
}

function resolveAction(action: MenuAction, ctx: MenuActionContext): () => void {
    switch (action.type) {
        case 'set-editing-field':
            return () => ctx.setEditingField(action.field);
        case 'delete':
            return () => ctx.onDelete();
    }
}

/** Convert config-driven menu items to DropdownMenuItemConfig */
export function resolveMenuItems(
    items: EditorMenuItemConfig[],
    ctx: MenuActionContext
): DropdownMenuItemConfig[] {
    return items.map((item) => {
        if ('type' in item) return item;
        return {
            label: item.label,
            variant: item.variant,
            onClick: resolveAction(item.action, ctx),
        };
    });
}

// ============================================
// Editor menu item constants
// ============================================

const EDIT_TITLE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'title' },
    label: 'Edit title',
};
const EDIT_IMAGE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'image' },
    label: 'Edit image',
};
const SEPARATOR: EditorMenuItemConfig = { type: 'separator' };
const DELETE: EditorMenuItemConfig = {
    action: { type: 'delete' },
    label: 'Delete',
    variant: 'danger',
};

// ============================================
// Per-type editor menu composition
// ============================================

export const EDITOR_MENU_CONFIG: Record<EntryType, EditorMenuItemConfig[]> = {
    event: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    mixset: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    link: [EDIT_TITLE, SEPARATOR, DELETE],
    custom: [EDIT_TITLE, SEPARATOR, DELETE],
};

// ============================================
// Tree item menu system (sidebar)
// ============================================

export type TreeMenuAction =
    | { type: 'edit' }
    | { type: 'delete' }
    | { type: 'remove-from-page' }
    | { type: 'toggle-visibility' };

export interface TreeMenuActionItem {
    action: TreeMenuAction;
    label: string;
    variant?: 'danger';
    /** Dynamic label resolved at render time */
    dynamicLabel?: (ctx: TreeMenuActionContext) => string;
}

export type TreeMenuItemConfig = TreeMenuActionItem | MenuSeparatorConfig;

export interface TreeMenuActionContext {
    onEdit: () => void;
    onDelete: () => void;
    onRemoveFromPage: () => void;
    onToggleVisibility: () => void;
    isVisible: boolean;
}

function resolveTreeAction(action: TreeMenuAction, ctx: TreeMenuActionContext): () => void {
    switch (action.type) {
        case 'edit':
            return () => ctx.onEdit();
        case 'delete':
            return () => ctx.onDelete();
        case 'remove-from-page':
            return () => ctx.onRemoveFromPage();
        case 'toggle-visibility':
            return () => ctx.onToggleVisibility();
    }
}

export function resolveTreeMenuItems(
    items: TreeMenuItemConfig[],
    ctx: TreeMenuActionContext
): DropdownMenuItemConfig[] {
    return items.map((item): DropdownMenuItemConfig => {
        if ('type' in item) return item;
        return {
            label: item.dynamicLabel?.(ctx) ?? item.label,
            variant: item.variant,
            onClick: resolveTreeAction(item.action, ctx),
        };
    });
}

// Tree menu item constants
const TREE_EDIT: TreeMenuItemConfig = { action: { type: 'edit' }, label: 'Edit' };
const TREE_DELETE: TreeMenuItemConfig = {
    action: { type: 'delete' },
    label: 'Delete',
    variant: 'danger',
};
const TREE_TOGGLE_VISIBILITY: TreeMenuItemConfig = {
    action: { type: 'toggle-visibility' },
    label: 'Hide',
    dynamicLabel: (ctx) => (ctx.isVisible ? 'Hide' : 'Show'),
};
const TREE_REMOVE_FROM_PAGE: TreeMenuItemConfig = {
    action: { type: 'remove-from-page' },
    label: 'Remove from Page',
    variant: 'danger',
};

/** Component section: Edit / Delete */
export const TREE_ENTRY_MENU: TreeMenuItemConfig[] = [TREE_EDIT, SEPARATOR, TREE_DELETE];

/** Page display section: Edit / Hide / Remove from Page */
export const TREE_PAGE_DISPLAY_MENU: TreeMenuItemConfig[] = [
    TREE_EDIT,
    TREE_TOGGLE_VISIBILITY,
    SEPARATOR,
    TREE_REMOVE_FROM_PAGE,
];
