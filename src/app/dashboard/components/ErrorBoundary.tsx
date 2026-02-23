'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/ErrorBoundary';
import type { ReactNode } from 'react';

/**
 * Dashboard 전용 Error Boundary.
 *
 * QueryErrorResetBoundary + react-error-boundary 조합으로
 * "다시 시도" 클릭 시 TanStack Query 캐시도 함께 리셋되어
 * 실제 재요청이 발생한다.
 */
export default function ErrorBoundaryWithQueryReset({ children }: { children: ReactNode }) {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
                    {children}
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
}
