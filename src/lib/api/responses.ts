// lib/api/responses.ts
import { NextResponse } from 'next/server';

import type { z } from 'zod';

/**
 * API 에러 정의
 */
export const ApiErrors = {
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다.',
        status: 401,
    },
    FORBIDDEN: {
        code: 'FORBIDDEN',
        message: '권한이 없습니다.',
        status: 403,
    },
    NOT_FOUND: (resource: string) => ({
        code: 'NOT_FOUND',
        message: `${resource}을(를) 찾을 수 없습니다.`,
        status: 404,
    }),
    VALIDATION: (field: string) => ({
        code: 'VALIDATION_ERROR',
        message: `${field}이(가) 필요합니다.`,
        status: 400,
    }),
    INTERNAL: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다.',
        status: 500,
    },
} as const;

type StaticError = {
    code: string;
    message: string;
    status: number;
};

/**
 * 성공 응답
 */
export function successResponse<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * 에러 응답
 */
export function errorResponse(error: StaticError) {
    return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
    );
}

/**
 * 인증 실패 응답
 */
export function unauthorizedResponse() {
    return errorResponse(ApiErrors.UNAUTHORIZED);
}

/**
 * 권한 없음 응답
 */
export function forbiddenResponse() {
    return errorResponse(ApiErrors.FORBIDDEN);
}

/**
 * 리소스 없음 응답
 */
export function notFoundResponse(resource: string) {
    return errorResponse(ApiErrors.NOT_FOUND(resource));
}

/**
 * 유효성 검증 실패 응답
 */
export function validationErrorResponse(field: string) {
    return errorResponse(ApiErrors.VALIDATION(field));
}

/**
 * 서버 에러 응답
 */
export function internalErrorResponse(message?: string) {
    const error = message ? { ...ApiErrors.INTERNAL, message } : ApiErrors.INTERNAL;
    return errorResponse(error);
}

/**
 * Zod 유효성 검증 실패 응답
 */
export function zodValidationErrorResponse(zodError: z.ZodError) {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: zodError.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                })),
            },
        },
        { status: 400 }
    );
}
