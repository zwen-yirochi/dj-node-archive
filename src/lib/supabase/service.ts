// src/lib/supabase/service.ts
// Service role 클라이언트 — Cron 등 유저 세션 없이 RLS를 우회해야 하는 서버 작업 전용
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
