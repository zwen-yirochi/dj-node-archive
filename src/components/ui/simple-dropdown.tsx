'use client';

import * as React from 'react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';

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

export type DropdownItem = DropdownActionItem | DropdownLinkItem;
export type DropdownMenuItemConfig = DropdownItem | DropdownSeparator;

// 타입 가드
function isSeparator(item: DropdownMenuItemConfig): item is DropdownSeparator {
    return 'type' in item && item.type === 'separator';
}

function isLinkItem(item: DropdownItem): item is DropdownLinkItem {
    return 'href' in item;
}

interface SimpleDropdownProps {
    trigger: React.ReactNode;
    items: DropdownMenuItemConfig[];
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
    contentClassName?: string;
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
}: SimpleDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className={className}>
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                className={cn(
                    'w-40 border-dashboard-border bg-dashboard-bg-card shadow-lg',
                    contentClassName
                )}
            >
                {items.map((item, index) => {
                    if (isSeparator(item)) {
                        return (
                            <DropdownMenuSeparator
                                key={`sep-${index}`}
                                className="bg-dashboard-border"
                            />
                        );
                    }

                    const Icon = item.icon;
                    const isDanger = item.variant === 'danger';
                    const itemClassName = cn(
                        'cursor-pointer',
                        isDanger
                            ? 'text-red-600 focus:bg-red-50 focus:text-red-600'
                            : 'text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text'
                    );

                    // 링크 아이템인 경우
                    if (isLinkItem(item)) {
                        return (
                            <DropdownMenuItem key={`item-${index}`} asChild>
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

                    // 액션 아이템인 경우
                    return (
                        <DropdownMenuItem
                            key={`item-${index}`}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={itemClassName}
                        >
                            {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                            {item.label}
                        </DropdownMenuItem>
                    );
                })}
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
};
