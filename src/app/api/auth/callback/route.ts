// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';

import { isSuccess } from '@/types/result';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('세션 교환 실패:', error.message, error);
        }

        if (!error) {
            // Auth 사용자 정보 가져오기
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();

            // 앱 DB에 사용자 동기화
            if (authUser) {
                const syncResult = await syncUserFromAuth(authUser);
                if (!isSuccess(syncResult)) {
                    console.error('사용자 동기화 실패:', syncResult.error);
                    // 동기화 실패해도 일단 진행 (기존 사용자일 수 있음)
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    // 인증 실패 시 에러 페이지로 리디렉트
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
