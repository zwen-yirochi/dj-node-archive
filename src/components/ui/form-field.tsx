'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    required?: boolean;
    helper?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * 선언적 폼 필드 래퍼 컴포넌트
 *
 * @example
 * ```tsx
 * <FormField label="제목" required helper="공연 또는 페스티벌 이름을 입력하세요">
 *   <Input value={title} onChange={(e) => setTitle(e.target.value)} />
 * </FormField>
 * ```
 */
export function FormField({
    label,
    required = false,
    helper,
    error,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <label className="block text-sm font-medium text-dashboard-text-secondary">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {helper && !error && (
                <p className="text-xs text-dashboard-text-placeholder">{helper}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

interface HelperTextProps {
    children: React.ReactNode;
    variant?: 'default' | 'error' | 'success';
    className?: string;
}

/**
 * 독립적인 헬퍼 텍스트 컴포넌트
 */
export function HelperText({ children, variant = 'default', className }: HelperTextProps) {
    const variantStyles = {
        default: 'text-dashboard-text-placeholder',
        error: 'text-red-500',
        success: 'text-green-600',
    };

    return <p className={cn('text-xs', variantStyles[variant], className)}>{children}</p>;
}

interface FormSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * 폼 섹션 그룹 컴포넌트
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h3 className="text-sm font-semibold text-dashboard-text">{title}</h3>
                    )}
                    {description && (
                        <p className="text-xs text-dashboard-text-muted">{description}</p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
