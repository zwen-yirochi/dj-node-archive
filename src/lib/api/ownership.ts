// lib/api/ownership.ts
import { createClient } from '@/lib/supabase/server';

type OwnershipResult =
    | { ok: true; pageId: string }
    | { ok: false; reason: 'not_found' | 'forbidden' };

/**
 * 컴포넌트의 소유권 검증
 * component → page → user_id 확인
 */
export async function verifyComponentOwnership(
    componentId: string,
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('components')
        .select('page_id, pages!inner(user_id)')
        .eq('id', componentId)
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
 * 여러 컴포넌트의 소유권 일괄 검증
 */
export async function verifyComponentsOwnership(
    componentIds: string[],
    userId: string
): Promise<OwnershipResult> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('components')
        .select('id, page_id, pages!inner(user_id)')
        .in('id', componentIds);

    if (error || !data || data.length !== componentIds.length) {
        return { ok: false, reason: 'not_found' };
    }

    // 모든 컴포넌트가 같은 페이지에 속하고, 해당 페이지가 현재 사용자 소유인지 확인
    const pageIds = new Set(data.map((c) => c.page_id));
    if (pageIds.size !== 1) {
        return { ok: false, reason: 'forbidden' };
    }

    const firstComponent = data[0];
    const page = firstComponent.pages as unknown as { user_id: string };
    if (page.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, pageId: firstComponent.page_id };
}

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
