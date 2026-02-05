// lib/api/ownership.ts
import { createClient } from '@/lib/supabase/server';

type OwnershipResult =
    | { ok: true; pageId: string }
    | { ok: false; reason: 'not_found' | 'forbidden' };

/**
 * 엔트리의 소유권 검증
 * entry → page → user_id 확인
 */
export async function verifyEntryOwnership(
    entryId: string,
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('entries')
        .select('page_id, pages!inner(user_id)')
        .eq('id', entryId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    const page = data.pages as unknown as { user_id: string };
    if (page.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: data.page_id };
}

/**
 * 여러 엔트리의 소유권 일괄 검증
 */
export async function verifyEntriesOwnership(
    entryIds: string[],
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('entries')
        .select('id, page_id, pages!inner(user_id)')
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
    const page = firstEntry.pages as unknown as { user_id: string };
    if (page.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: firstEntry.page_id };
}

/** @deprecated Use verifyEntryOwnership instead */
export const verifyComponentOwnership = verifyEntryOwnership;
/** @deprecated Use verifyEntriesOwnership instead */
export const verifyComponentsOwnership = verifyEntriesOwnership;

/**
 * ViewItem의 소유권 검증
 * view_item → page → user_id 확인
 */
export async function verifyViewItemOwnership(
    viewItemId: string,
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('page_view_items')
        .select('page_id, pages!inner(user_id)')
        .eq('id', viewItemId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    const page = data.pages as unknown as { user_id: string };
    if (page.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: data.page_id };
}

/**
 * 여러 ViewItem의 소유권 일괄 검증
 */
export async function verifyViewItemsOwnership(
    viewItemIds: string[],
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('page_view_items')
        .select('id, page_id, pages!inner(user_id)')
        .in('id', viewItemIds);

    if (error || !data || data.length !== viewItemIds.length) {
        return { ok: false, reason: 'not_found' };
    }

    const pageIds = new Set(data.map((v) => v.page_id));
    if (pageIds.size !== 1) {
        return { ok: false, reason: 'forbidden' };
    }

    const firstItem = data[0];
    const page = firstItem.pages as unknown as { user_id: string };
    if (page.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: firstItem.page_id };
}

/**
 * 페이지의 소유권 검증
 */
export async function verifyPageOwnership(
    pageId: string,
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('pages')
        .select('id, user_id')
        .eq('id', pageId)
        .single();

    if (error || !data) {
        return { ok: false, reason: 'not_found' };
    }

    if (data.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: data.id };
}
