'use client';

import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { type AppError, type ErrorCode, getErrorMessage } from '@/types/result';

interface ErrorToastOptions {
    onRetry?: () => void;
}

const ERROR_TITLES: Record<ErrorCode, string> = {
    NETWORK_ERROR: '네트워크 오류',
    DATABASE_ERROR: '데이터 오류',
    VALIDATION_ERROR: '입력 오류',
    NOT_FOUND: '찾을 수 없음',
    UNAUTHORIZED: '인증 필요',
    FORBIDDEN: '접근 거부',
    CONFLICT: '충돌 발생',
    UNKNOWN_ERROR: '오류 발생',
};

export function useErrorToast() {
    const showError = useCallback((error: AppError, options?: ErrorToastOptions) => {
        const title = ERROR_TITLES[error.code] || ERROR_TITLES.UNKNOWN_ERROR;
        const description = getErrorMessage(error);

        toast({
            variant: 'destructive',
            title,
            description,
        });

        // 콘솔에 상세 에러 로깅 (개발 환경)
        if (process.env.NODE_ENV === 'development') {
            console.error('[Error Toast]', {
                code: error.code,
                message: error.message,
                cause: error.cause,
            });
        }
    }, []);

    const showNetworkError = useCallback(
        (message?: string) => {
            showError({
                code: 'NETWORK_ERROR',
                message: message || '네트워크 연결을 확인해주세요.',
            });
        },
        [showError]
    );

    const showValidationError = useCallback(
        (message: string, field?: string) => {
            showError({
                code: 'VALIDATION_ERROR',
                message,
            });
        },
        [showError]
    );

    const showNotFoundError = useCallback(
        (resource?: string) => {
            showError({
                code: 'NOT_FOUND',
                message: resource
                    ? `${resource}을(를) 찾을 수 없습니다.`
                    : '요청하신 정보를 찾을 수 없습니다.',
            });
        },
        [showError]
    );

    return {
        showError,
        showNetworkError,
        showValidationError,
        showNotFoundError,
    };
}

export default useErrorToast;
