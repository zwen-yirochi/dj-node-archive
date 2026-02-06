/**
 * Playwright Auth Setup
 *
 * Supabase Admin API(service_role)로 테스트 유저를 자동 생성하고
 * REST API로 로그인하여 세션 쿠키를 주입합니다.
 * 수동 토큰 추출이 필요 없습니다.
 *
 * 필요한 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL      - Supabase 프로젝트 URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key
 *   E2E_SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (Admin API용)
 *   E2E_TEST_USER_EMAIL           - (선택) 테스트 유저 이메일 (기본: e2e-test@example.com)
 *   E2E_TEST_USER_PASSWORD        - (선택) 테스트 유저 비밀번호 (기본: e2e-test-password-123!)
 */
import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const AUTH_FILE = 'e2e/.auth/user.json';

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'e2e-test-password-123!';

setup('authenticate', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        throw new Error(
            'Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    // 1. Admin API로 테스트 유저 생성 (이미 존재하면 무시)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === TEST_EMAIL);

    if (!userExists) {
        const { error: createError } = await adminClient.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
        });
        if (createError) {
            throw new Error(`Failed to create test user: ${createError.message}`);
        }
    }

    // 2. REST API로 로그인하여 세션 토큰 획득
    const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
        },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Failed to sign in test user: ${error}`);
    }

    const session = await tokenResponse.json();

    // 3. 세션 쿠키 주입
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    const cookieValue = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: 'bearer',
    });

    await page.context().addCookies([
        {
            name: cookieName,
            value: cookieValue,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
        },
    ]);

    // 4. 대시보드 접근 가능 확인
    await page.goto('/dashboard');
    await expect(page.locator('text=DNA')).toBeVisible({ timeout: 15000 });

    // 5. 인증 상태 저장
    await page.context().storageState({ path: AUTH_FILE });
});
