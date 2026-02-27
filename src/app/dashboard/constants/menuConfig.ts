/**
 * 메뉴 시스템 설정
 * - 선언적 메뉴 액션 타입 + 리졸버
 * - 타입별 에디터 메뉴 구성
 */

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import type { LucideIcon } from 'lucide-react';
import { ImageIcon, Trash2, Type } from 'lucide-react';
import type { EntryType } from './entryConfig';

// ============================================
// Menu action types
// ============================================

/** 선언적 메뉴 액션 — variant 추가 시 union 확장 + resolveAction에 case 추가 */
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

/** 컴포넌트가 제공하는 액션 컨텍스트 */
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

/** config-driven 메뉴 아이템 → DropdownMenuItemConfig 변환 */
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
// 공유 메뉴 아이템 상수
// ============================================

const EDIT_TITLE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'title' },
    label: '제목 변경',
    icon: Type,
};
const EDIT_IMAGE: EditorMenuItemConfig = {
    action: { type: 'set-editing-field', field: 'image' },
    label: '이미지 변경',
    icon: ImageIcon,
};
const SEPARATOR: EditorMenuItemConfig = { type: 'separator' };
const DELETE: EditorMenuItemConfig = {
    action: { type: 'delete' },
    label: '삭제',
    icon: Trash2,
    variant: 'danger',
};

// ============================================
// 타입별 에디터 메뉴 구성
// ============================================

export const EDITOR_MENU_CONFIG: Record<EntryType, EditorMenuItemConfig[]> = {
    event: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    mixset: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    link: [EDIT_TITLE, SEPARATOR, DELETE],
};
