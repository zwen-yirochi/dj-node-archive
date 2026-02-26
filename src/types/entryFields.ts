/**
 * Entry 필드 관련 타입 정의
 */

import type { DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import type { LucideIcon } from 'lucide-react';

// ============================================
// Editor types
// ============================================

export interface EditorFieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean;
}

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

export interface EntryEditorConfig {
    fields: EditorFieldConfig[];
    menuItems: EditorMenuItemConfig[];
}

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
// Validation types
// ============================================

export type ValidationRule = 'required' | 'url' | false;

export interface FieldValidationConfig {
    key: string;
    label: string;
    create: ValidationRule;
    view: ValidationRule;
    isUrl?: boolean;
    allowEmptyArray?: boolean;
}

// ============================================
// Common types (유지)
// ============================================

/** 검증 결과 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    /** 누락된 필드 키 목록 */
    missingFields: string[];
}

/** TreeItem 상태 (우측 아이콘 표시용) */
export type TreeItemStatus = 'inView' | 'normal' | 'warning';
