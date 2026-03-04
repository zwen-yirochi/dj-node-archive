/**
 * Menu system configuration
 * - Declarative menu action types + resolver
 * - Per-type editor menu composition
 */

import { Eye, EyeOff, ImageIcon, Pencil, Trash2, Type, type LucideIcon } from 'lucide-react';

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import type { EntryType } from './entryConfig';

// ============================================
// Menu action types
// ============================================

/** Declarative menu action — extend the union and add a case to resolveAction when adding variants */
export type MenuAction =
    | { type: 'set-editing-field'; field: 'title' | 'image' }
    | { type: 'delete' };

export interface MenuActionItem {
    action: MenuAction;
    label: string;
    icon: LucideIcon;
    variant?: 'danger';
}

export interface MenuSeparatorConfig {
    type: 'separator';
}

export type EditorMenuItemConfig = MenuActionItem | MenuSeparatorConfig;

// ============================================
// Menu action resolution
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
            icon: item.icon,
            variant: item.variant,
            onClick: resolveAction(item.action, ctx),
        };
    });
}

// ============================================
// Shared menu item constants
// ============================================

const EDIT_TITLE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'title' },
    label: 'Edit title',
    icon: Type,
};
const EDIT_IMAGE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'image' },
    label: 'Edit image',
    icon: ImageIcon,
};
const SEPARATOR: EditorMenuItemConfig = { type: 'separator' };
const DELETE: EditorMenuItemConfig = {
    action: { type: 'delete' },
    label: 'Delete',
    icon: Trash2,
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
    icon: LucideIcon;
    variant?: 'danger';
    /** Dynamic overrides resolved at render time */
    dynamic?: (ctx: TreeMenuActionContext) => { label?: string; icon?: LucideIcon };
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
        const overrides = item.dynamic?.(ctx);
        return {
            label: overrides?.label ?? item.label,
            icon: overrides?.icon ?? item.icon,
            variant: item.variant,
            onClick: resolveTreeAction(item.action, ctx),
        };
    });
}

// Shared tree menu items
const TREE_EDIT: TreeMenuItemConfig = { action: { type: 'edit' }, label: 'Edit', icon: Pencil };
const TREE_DELETE: TreeMenuItemConfig = {
    action: { type: 'delete' },
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
};
const TREE_TOGGLE_VISIBILITY: TreeMenuItemConfig = {
    action: { type: 'toggle-visibility' },
    label: 'Hide',
    icon: Eye,
    dynamic: (ctx) => ({
        label: ctx.isVisible ? 'Hide' : 'Show',
        icon: ctx.isVisible ? Eye : EyeOff,
    }),
};
const TREE_REMOVE_FROM_PAGE: TreeMenuItemConfig = {
    action: { type: 'remove-from-page' },
    label: 'Remove from Page',
    icon: Trash2,
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
