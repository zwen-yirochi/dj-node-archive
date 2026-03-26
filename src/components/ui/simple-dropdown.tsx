'use client';

import * as React from 'react';
import Link from 'next/link';

import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './dropdown-menu';

// 클릭 액션 아이템 타입
export interface DropdownActionItem {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

// 링크 아이템 타입
export interface DropdownLinkItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    variant?: 'default' | 'danger';
    external?: boolean;
}

// 구분선 타입
export interface DropdownSeparator {
    type: 'separator';
}

// 서브메뉴 아이템 타입
export interface DropdownSubmenuItem {
    type: 'submenu';
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
    children?: DropdownMenuItemConfig[]; // 정적 서브메뉴
    resolverKey?: string; // 동적 서브메뉴
}

// 동적 서브메뉴 resolver 타입
export type SubmenuResolver = () => DropdownMenuItemConfig[];

export type DropdownItem = DropdownActionItem | DropdownLinkItem;
export type DropdownMenuItemConfig = DropdownItem | DropdownSeparator | DropdownSubmenuItem;

// 타입 가드
function isSeparator(item: DropdownMenuItemConfig): item is DropdownSeparator {
    return 'type' in item && item.type === 'separator';
}

function isLinkItem(item: DropdownItem): item is DropdownLinkItem {
    return 'href' in item;
}

function isSubmenu(item: DropdownMenuItemConfig): item is DropdownSubmenuItem {
    return 'type' in item && item.type === 'submenu';
}

interface SimpleDropdownProps {
    trigger: React.ReactNode;
    items: DropdownMenuItemConfig[];
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
    contentClassName?: string;
    resolvers?: Record<string, SubmenuResolver>;
    onOpenChange?: (open: boolean) => void;
}

function RenderItem({
    item,
    resolvers,
}: {
    item: DropdownMenuItemConfig;
    resolvers?: Record<string, SubmenuResolver>;
}) {
    if (isSeparator(item)) {
        return <DropdownMenuSeparator className="bg-dashboard-border" />;
    }

    if (isSubmenu(item)) {
        return <SubmenuItem item={item} resolvers={resolvers} />;
    }

    const Icon = item.icon;
    const isDanger = item.variant === 'danger';
    const itemClassName = cn(
        'cursor-pointer',
        isDanger
            ? 'text-dashboard-danger focus:bg-dashboard-danger-bg'
            : 'text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text'
    );

    if (isLinkItem(item)) {
        return (
            <DropdownMenuItem asChild>
                <Link
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={itemClassName}
                >
                    {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                    {item.label}
                </Link>
            </DropdownMenuItem>
        );
    }

    return (
        <DropdownMenuItem onClick={item.onClick} disabled={item.disabled} className={itemClassName}>
            {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
            {item.label}
        </DropdownMenuItem>
    );
}

const SUBMENU_CONTENT_CLASS =
    'w-44 rounded-lg border-dashboard-border/40 bg-white/90 shadow-md backdrop-blur-xl';

function SubmenuItem({
    item,
    resolvers,
}: {
    item: DropdownSubmenuItem;
    resolvers?: Record<string, SubmenuResolver>;
}) {
    const children = item.children ?? (item.resolverKey && resolvers?.[item.resolverKey]?.()) ?? [];

    const Icon = item.icon;

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger
                disabled={item.disabled || children.length === 0}
                className="text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
            >
                {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                {item.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className={SUBMENU_CONTENT_CLASS}>
                    {children.length === 0 ? (
                        <DropdownMenuItem disabled className="text-dashboard-text-placeholder">
                            No items
                        </DropdownMenuItem>
                    ) : (
                        children.map((child, index) => (
                            <RenderItem key={index} item={child} resolvers={resolvers} />
                        ))
                    )}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
}

/**
 * 선언적 드롭다운 메뉴 컴포넌트
 *
 * @example
 * ```tsx
 * <SimpleDropdown
 *   trigger={<Button>메뉴</Button>}
 *   items={[
 *     { label: '편집', onClick: handleEdit, icon: Pencil },
 *     { type: 'separator' },
 *     { label: '삭제', onClick: handleDelete, icon: Trash2, variant: 'danger' },
 *   ]}
 * />
 * ```
 */
export function SimpleDropdown({
    trigger,
    items,
    align = 'end',
    side = 'bottom',
    className,
    contentClassName,
    resolvers,
    onOpenChange,
}: SimpleDropdownProps) {
    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild className={className}>
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                className={cn(
                    'w-40 rounded-lg border-dashboard-border/40 bg-white/90 shadow-md backdrop-blur-xl',
                    contentClassName
                )}
            >
                {items.map((item, index) => (
                    <RenderItem key={index} item={item} resolvers={resolvers} />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// 자주 사용되는 메뉴 아이템 헬퍼
export const dropdownItems = {
    separator: (): DropdownSeparator => ({ type: 'separator' }),

    action: (
        label: string,
        onClick: () => void,
        options?: { icon?: LucideIcon; variant?: 'default' | 'danger'; disabled?: boolean }
    ): DropdownActionItem => ({
        label,
        onClick,
        ...options,
    }),

    link: (
        label: string,
        href: string,
        options?: { icon?: LucideIcon; variant?: 'default' | 'danger'; external?: boolean }
    ): DropdownLinkItem => ({
        label,
        href,
        ...options,
    }),

    submenu: (
        label: string,
        options: {
            icon?: LucideIcon;
            disabled?: boolean;
            children?: DropdownMenuItemConfig[];
            resolverKey?: string;
        }
    ): DropdownSubmenuItem => ({
        type: 'submenu',
        label,
        ...options,
    }),
};
