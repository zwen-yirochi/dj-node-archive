/**
 * Menu system configuration
 * - Declarative menu action types + resolver
 * - Per-type editor menu composition
 */

import { ImageIcon, Trash2, Type, type LucideIcon } from 'lucide-react';

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
