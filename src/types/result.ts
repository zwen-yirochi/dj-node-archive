// types/result.ts - Result 패턴 기반 에러 처리 타입 시스템

// ============================================
// Result Type (Discriminated Union)
// ============================================

export interface Success<T> {
    success: true;
    data: T;
}

export interface Failure<E> {
    success: false;
    error: E;
}

export type Result<T, E = AppError> = Success<T> | Failure<E>;

// ============================================
// Error Types
// ============================================

export type ErrorCode =
    | 'NETWORK_ERROR'
    | 'DATABASE_ERROR'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'CONFLICT'
    | 'UNKNOWN_ERROR';

export interface AppError {
    code: ErrorCode;
    message: string;
    cause?: unknown;
}

export interface NetworkError extends AppError {
    code: 'NETWORK_ERROR';
    statusCode?: number;
}

export interface DatabaseError extends AppError {
    code: 'DATABASE_ERROR';
    query?: string;
}

export interface ValidationError extends AppError {
    code: 'VALIDATION_ERROR';
    field?: string;
}

export interface NotFoundError extends AppError {
    code: 'NOT_FOUND';
    resource?: string;
}

export interface UnauthorizedError extends AppError {
    code: 'UNAUTHORIZED';
}

export interface ForbiddenError extends AppError {
    code: 'FORBIDDEN';
}

export interface ConflictError extends AppError {
    code: 'CONFLICT';
    resource?: string;
}

// ============================================
// Utility Functions
// ============================================

export function success<T>(data: T): Success<T> {
    return { success: true, data };
}

export function failure<E = AppError>(error: E): Failure<E> {
    return { success: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
    return result.success === true;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
    return result.success === false;
}

export function unwrap<T, E>(result: Result<T, E>): T {
    if (isSuccess(result)) {
        return result.data;
    }
    throw new Error('Cannot unwrap a Failure result');
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (isSuccess(result)) {
        return result.data;
    }
    return defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (isSuccess(result)) {
        return success(fn(result.data));
    }
    return result;
}

export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (isFailure(result)) {
        return failure(fn(result.error));
    }
    return result;
}

// ============================================
// Error Factory Functions
// ============================================

export function createNetworkError(
    message: string,
    statusCode?: number,
    cause?: unknown
): NetworkError {
    return {
        code: 'NETWORK_ERROR',
        message,
        statusCode,
        cause,
    };
}

export function createDatabaseError(
    message: string,
    query?: string,
    cause?: unknown
): DatabaseError {
    return {
        code: 'DATABASE_ERROR',
        message,
        query,
        cause,
    };
}

export function createValidationError(message: string, field?: string): ValidationError {
    return {
        code: 'VALIDATION_ERROR',
        message,
        field,
    };
}

export function createNotFoundError(message: string, resource?: string): NotFoundError {
    return {
        code: 'NOT_FOUND',
        message,
        resource,
    };
}

export function createUnauthorizedError(message: string): UnauthorizedError {
    return {
        code: 'UNAUTHORIZED',
        message,
    };
}

export function createForbiddenError(message: string): ForbiddenError {
    return {
        code: 'FORBIDDEN',
        message,
    };
}

export function createConflictError(message: string, resource?: string): ConflictError {
    return {
        code: 'CONFLICT',
        message,
        resource,
    };
}

// ============================================
// Error Message Mapping (for UI)
// ============================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    DATABASE_ERROR: '데이터 처리 중 오류가 발생했습니다.',
    VALIDATION_ERROR: '입력값을 확인해주세요.',
    NOT_FOUND: '요청하신 정보를 찾을 수 없습니다.',
    UNAUTHORIZED: '로그인이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    CONFLICT: '이미 존재하는 데이터입니다.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

export function getErrorMessage(error: AppError): string {
    return error.message || ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}
