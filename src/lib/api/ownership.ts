// lib/api/ownership.ts
import { createClient } from '@/lib/supabase/server';

type OwnershipResult =
    | { ok: true; pageId: string }
    | { ok: false; reason: 'not_found' | 'forbidden' };

/**
 * 엔트리의 소유권 검증
 * entry → page → user → auth_user_id 확인
 * @param entryId - 엔트리 ID
 * @param authUserId - auth.users.id (Supabase Auth ID)
 */
export async function verifyEntryOwnership(
    entryId: string,
    authUserId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('entries')
        .select('page_id, pages!inner(user_id, users!inner(auth_user_id))')
        .eq('id', entryId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    const page = data.pages as unknown as { user_id: string; users: { auth_user_id: string } };
    if (page.users.auth_user_id !== authUserId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: data.page_id };
}

/**
 * 여러 엔트리의 소유권 일괄 검증
 * @param entryIds - 엔트리 ID 배열
 * @param authUserId - auth.users.id (Supabase Auth ID)
 */
export async function verifyEntriesOwnership(
    entryIds: string[],
    authUserId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('entries')
        .select('id, page_id, pages!inner(user_id, users!inner(auth_user_id))')
        .in('id', entryIds);

    if (error || !data || data.length !== entryIds.length) {
        return { ok: false, reason: 'not_found' };
    }

    // 모든 엔트리가 같은 페이지에 속하고, 해당 페이지가 현재 사용자 소유인지 확인
    const pageIds = new Set(data.map((e) => e.page_id));
    if (pageIds.size !== 1) {
        return { ok: false, reason: 'forbidden' };
    }

    const firstEntry = data[0];
    const page = firstEntry.pages as unknown as {
        user_id: string;
        users: { auth_user_id: string };
    };
    if (page.users.auth_user_id !== authUserId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: firstEntry.page_id };
}

/**
 * DisplayEntry의 소유권 검증
 * display_entry → entry → page → user → auth_user_id 확인
 * @param displayEntryId - DisplayEntry ID
 * @param authUserId - auth.users.id (Supabase Auth ID)
 */
export async function verifyDisplayEntryOwnership(
    displayEntryId: string,
    authUserId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('page_view_items')
        .select('entry_id, entries!inner(page_id, pages!inner(user_id, users!inner(auth_user_id)))')
        .eq('id', displayEntryId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    const entry = data.entries as unknown as {
        page_id: string;
        pages: { user_id: string; users: { auth_user_id: string } };
    };
    if (entry.pages.users.auth_user_id !== authUserId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: entry.page_id };
}

/**
 * 여러 DisplayEntry의 소유권 일괄 검증
 * @param displayEntryIds - DisplayEntry ID 배열
 * @param authUserId - auth.users.id (Supabase Auth ID)
 */
export async function verifyDisplayEntriesOwnership(
    displayEntryIds: string[],
    authUserId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('page_view_items')
        .select(
            'id, entry_id, entries!inner(page_id, pages!inner(user_id, users!inner(auth_user_id)))'
        )
        .in('id', displayEntryIds);

    if (error || !data || data.length !== displayEntryIds.length) {
        return { ok: false, reason: 'not_found' };
    }

    // entries를 통해 page_id 추출
    const pageIds = new Set(
        data.map((v) => {
            const entry = v.entries as unknown as { page_id: string };
            return entry.page_id;
        })
    );
    if (pageIds.size !== 1) {
        return { ok: false, reason: 'forbidden' };
    }

    const firstItem = data[0];
    const entry = firstItem.entries as unknown as {
        page_id: string;
        pages: { user_id: string; users: { auth_user_id: string } };
    };
    if (entry.pages.users.auth_user_id !== authUserId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: entry.page_id };
}

/**
 * 페이지의 소유권 검증
 * @param pageId - 페이지 ID
 * @param authUserId - auth.users.id (Supabase Auth ID)
 */
export async function verifyPageOwnership(
    pageId: string,
    authUserId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    // pages → users 조인하여 auth_user_id로 검증
    const { data, error } = await supabase
        .from('pages')
        .select('id, user_id, users!inner(auth_user_id)')
        .eq('id', pageId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    const user = data.users as unknown as { auth_user_id: string };
    if (user.auth_user_id !== authUserId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: data.id };
}
