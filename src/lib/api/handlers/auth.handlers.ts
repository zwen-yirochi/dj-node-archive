// lib/api/handlers/auth.handlers.ts
// Auth 사용자 → 앱 DB 동기화 핸들러
import type { User as AuthUser } from '@supabase/supabase-js';

import type { User } from '@/types/database';
import { createDatabaseError, failure, isSuccess, success, type Result } from '@/types/result';
import { createDefaultPage, findPageByUserId } from '@/lib/db/queries/page.queries';
import { createUser, findUserByAuthId } from '@/lib/db/queries/user.queries';

function generateUsername(email: string): string {
    const base = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
    const suffix = Math.floor(Math.random() * 10000);
    return base ? `${base}-${suffix}` : `user-${suffix}`;
}

function generateDisplayName(authUser: AuthUser): string {
    // 우선순위: full_name > name > email 앞부분
    const metadata = authUser.user_metadata;
    if (metadata?.full_name) {
        return metadata.full_name;
    }
    if (metadata?.name) {
        return metadata.name;
    }
    return authUser.email?.split('@')[0] || 'User';
}

export async function syncUserFromAuth(authUser: AuthUser): Promise<Result<User>> {
    // 1. 기존 사용자 조회
    const existingResult = await findUserByAuthId(authUser.id);
    if (!isSuccess(existingResult)) {
        return existingResult;
    }

    // 2. 이미 존재하면 반환
    if (existingResult.data) {
        return success(existingResult.data);
    }

    // 3. 새 사용자 생성
    const email = authUser.email;
    if (!email) {
        return failure(createDatabaseError('이메일이 없습니다.', 'syncUserFromAuth'));
    }

    const username = generateUsername(email);
    const displayName = generateDisplayName(authUser);

    const createResult = await createUser({
        auth_user_id: authUser.id,
        email: email,
        username: username,
        display_name: displayName,
        avatar_url: authUser.user_metadata?.avatar_url,
    });

    if (!isSuccess(createResult)) {
        return createResult;
    }

    const newUser = createResult.data;

    // 4. 기본 페이지 존재 여부 확인
    const pageResult = await findPageByUserId(newUser.id);
    if (!isSuccess(pageResult)) {
        return failure(createDatabaseError('페이지 조회 실패', 'syncUserFromAuth'));
    }

    // 5. 페이지가 없으면 생성
    if (!pageResult.data) {
        const createPageResult = await createDefaultPage(newUser.id, username);
        if (!isSuccess(createPageResult)) {
            // 페이지 생성 실패해도 사용자는 반환 (로그만 남김)
            console.error('기본 페이지 생성 실패:', createPageResult.error);
        }
    }

    return success(newUser);
}
