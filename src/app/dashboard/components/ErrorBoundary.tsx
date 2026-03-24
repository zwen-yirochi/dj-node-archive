'use client';

import { ErrorBoundary } from 'react-error-boundary';
import type { ReactNode } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

import { ErrorFallback } from '@/components/ErrorBoundary';

/**
 * Dashboard-specific Error Boundary.
 *
 * Combines QueryErrorResetBoundary + react-error-boundary so that
 * clicking "Retry" also resets the TanStack Query cache,
 * triggering an actual re-fetch.
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
