'use client';

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { type ErrorCode } from '@/types/result';
import type { ReactNode } from 'react';

// ============================================
// Error → ErrorCode 매핑
// ============================================

function resolveErrorCode(error: Error): ErrorCode {
    if (error.message.includes('fetch') || error.message.includes('network')) {
        return 'NETWORK_ERROR';
    }
    return 'UNKNOWN_ERROR';
}

// ============================================
// ErrorFallback — react-error-boundary의 FallbackProps 사용
// ============================================

const ERROR_DISPLAY: Record<ErrorCode, { title: string; description: string }> = {
    NETWORK_ERROR: {
        title: '네트워크 오류',
        description: '인터넷 연결을 확인하고 다시 시도해주세요.',
    },
    DATABASE_ERROR: {
        title: '데이터 오류',
        description: '데이터를 불러오는 중 문제가 발생했습니다.',
    },
    VALIDATION_ERROR: {
        title: '입력 오류',
        description: '입력값을 확인해주세요.',
    },
    NOT_FOUND: {
        title: '찾을 수 없음',
        description: '요청하신 정보를 찾을 수 없습니다.',
    },
    UNAUTHORIZED: {
        title: '인증 필요',
        description: '로그인이 필요합니다.',
    },
    FORBIDDEN: {
        title: '접근 거부',
        description: '이 페이지에 접근할 권한이 없습니다.',
    },
    CONFLICT: {
        title: '충돌 발생',
        description: '이미 존재하는 데이터입니다.',
    },
    UNKNOWN_ERROR: {
        title: '오류 발생',
        description: '예상치 못한 오류가 발생했습니다.',
    },
};

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const code = resolveErrorCode(normalizedError);
    const { title, description } = ERROR_DISPLAY[code];

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-stone-800">{title}</h2>
                <p className="mb-1 text-stone-600">{description}</p>
                {normalizedError.message && normalizedError.message !== description && (
                    <p className="text-sm text-stone-500">{normalizedError.message}</p>
                )}
            </div>
            <Button onClick={resetErrorBoundary} variant="outline">
                다시 시도
            </Button>
        </div>
    );
}

// ============================================
// ErrorBoundary — react-error-boundary 래퍼
// ============================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

export function ErrorBoundary({ children, fallback, onReset }: ErrorBoundaryProps) {
    return (
        <ReactErrorBoundary
            FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}
            onReset={onReset}
            onError={(error, info) => {
                console.error('ErrorBoundary caught:', error, info);
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}

export default ErrorBoundary;
