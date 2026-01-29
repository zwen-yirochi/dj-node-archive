'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { type AppError, type ErrorCode } from '@/types/result';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: AppError | null;
}

function mapErrorToAppError(error: Error): AppError {
    // 네트워크 에러 감지
    if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
            code: 'NETWORK_ERROR',
            message: '네트워크 연결을 확인해주세요.',
            cause: error,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: '예상치 못한 오류가 발생했습니다.',
        cause: error,
    };
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error: mapErrorToAppError(error),
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error: AppError | null;
    onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
    const errorMessages: Record<ErrorCode, { title: string; description: string }> = {
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

    const errorCode = error?.code ?? 'UNKNOWN_ERROR';
    const { title, description } = errorMessages[errorCode];

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-stone-800">{title}</h2>
                <p className="mb-1 text-stone-600">{description}</p>
                {error?.message && error.message !== description && (
                    <p className="text-sm text-stone-500">{error.message}</p>
                )}
            </div>
            {onRetry && (
                <Button onClick={onRetry} variant="outline">
                    다시 시도
                </Button>
            )}
        </div>
    );
}

export default ErrorBoundary;
