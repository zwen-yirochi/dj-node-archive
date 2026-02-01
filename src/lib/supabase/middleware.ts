// src/lib/supabase/middleware.ts
// 미들웨어용 Supabase 클라이언트
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options: CookieOptions;
                    }[]
                ) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 세션 갱신 (반드시 호출해야 함)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 인증이 필요한 경로 보호
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isLoginPage = request.nextUrl.pathname === '/login';

    if (isProtectedRoute && !user) {
        // 미인증 사용자가 보호된 경로 접근 시 로그인 페이지로 리디렉트
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    if (isLoginPage && user) {
        // 이미 로그인된 사용자가 로그인 페이지 접근 시 대시보드로 리디렉트
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
