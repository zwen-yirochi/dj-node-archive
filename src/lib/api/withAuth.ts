// lib/api/withAuth.ts
import { createClient } from '@/lib/supabase/server';
import { unauthorizedResponse, internalErrorResponse } from './responses';
import type { User, SupabaseClient } from '@supabase/supabase-js';

/**
 * 인증 컨텍스트
 */
export interface AuthContext {
    user: User;
    supabase: SupabaseClient;
}

/**
 * 라우트 파라미터 (Next.js 15+ 형식)
 */
export interface RouteParams<T = Record<string, string>> {
    params: Promise<T>;
}

/**
 * 인증된 핸들러 타입
 */
type AuthenticatedHandler<TParams = Record<string, string>> = (
    request: Request,
    context: AuthContext & { params: TParams }
) => Promise<Response>;

/**
 * 인증 미들웨어
 *
 * @example
 * // 기본 사용
 * export const GET = withAuth(async (request, { user, supabase }) => {
 *     return successResponse({ userId: user.id });
 * });
 *
 * @example
 * // 라우트 파라미터 사용
 * export const PATCH = withAuth<{ id: string }>(async (request, { user, supabase, params }) => {
 *     const { id } = params;
 *     return successResponse({ id });
 * });
 */
export function withAuth<TParams = Record<string, string>>(handler: AuthenticatedHandler<TParams>) {
    return async (request: Request, routeContext?: RouteParams<TParams>) => {
        try {
            const supabase = await createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return unauthorizedResponse();
            }

            // 라우트 파라미터 처리 (Next.js 15+에서는 Promise)
            const params = routeContext?.params ? await routeContext.params : ({} as TParams);

            return handler(request, { user, supabase, params });
        } catch (err) {
            console.error('withAuth error:', err);
            return internalErrorResponse();
        }
    };
}

/**
 * 선택적 인증 미들웨어 (인증 없어도 허용, 있으면 user 제공)
 */
export function withOptionalAuth<TParams = Record<string, string>>(
    handler: (
        request: Request,
        context: { user: User | null; supabase: SupabaseClient; params: TParams }
    ) => Promise<Response>
) {
    return async (request: Request, routeContext?: RouteParams<TParams>) => {
        try {
            const supabase = await createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            const params = routeContext?.params ? await routeContext.params : ({} as TParams);

            return handler(request, { user, supabase, params });
        } catch (err) {
            console.error('withOptionalAuth error:', err);
            return internalErrorResponse();
        }
    };
}
