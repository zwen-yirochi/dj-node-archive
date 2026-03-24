// lib/api/fetch-utils.ts

import { Result } from '@/types';

type FetchOptions = {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
};

/**
 * API 호출 래퍼 - 에러 처리 및 타입 안전성 제공
 */
export async function apiFetch<T>(url: string, options: FetchOptions): Promise<Result<T>> {
    try {
        const response = await fetch(url, {
            method: options.method,
            headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: options.signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: errorText || `Request failed with status ${response.status}`,
                    cause: 'api fetch error',
                },
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'Unknown error occurred',
                cause: error instanceof Error,
            },
        };
    }
}
