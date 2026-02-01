// src/lib/supabase/server.ts
// 서버 컴포넌트 / API Route용 Supabase 클라이언트
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options: CookieOptions;
                    }[]
                ) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // Server Component에서 호출될 때는 쿠키 설정이 불가능
                        // 미들웨어에서 세션 갱신을 처리하므로 무시
                    }
                },
            },
        }
    );
}
