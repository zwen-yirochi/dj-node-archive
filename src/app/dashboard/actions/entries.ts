// app/dashboard/actions/entries.ts
'use server';

import { apiFetch } from '@/lib/api/fetch-utils';
import type { ContentEntry } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * 엔트리 생성
 */
export async function createEntry(entry: ContentEntry, pageId: string) {
    const result = await apiFetch<{ id: string }>('/api/entries', {
        method: 'POST',
        body: { pageId, entry, publishOption: 'private' },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * 엔트리 수정
 */
export async function updateEntry(entry: ContentEntry) {
    const result = await apiFetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        body: { entry },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * 엔트리 삭제
 */
export async function deleteEntry(id: string) {
    const result = await apiFetch(`/api/entries/${id}`, {
        method: 'DELETE',
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * 섹션 아이템 순서 변경
 */
export async function reorderSectionItems(updates: Array<{ id: string; position: number }>) {
    const result = await apiFetch('/api/entries/reorder', {
        method: 'PATCH',
        body: { updates },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * Display에 추가
 */
export async function addToDisplay(entryId: string, displayOrder: number) {
    const result = await apiFetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        body: { displayOrder, isVisible: true },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * Display에서 제거
 */
export async function removeFromDisplay(entryId: string) {
    const result = await apiFetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        body: { displayOrder: null },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * Display 순서 변경
 */
export async function reorderDisplayEntries(updates: Array<{ id: string; displayOrder: number }>) {
    const result = await apiFetch('/api/entries/reorder-display', {
        method: 'PATCH',
        body: { updates },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}

/**
 * Visibility 토글
 */
export async function toggleVisibility(entryId: string, currentVisibility: boolean) {
    const result = await apiFetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        body: { isVisible: !currentVisibility },
    });

    if (result.success) {
        revalidatePath('/dashboard');
    }

    return result;
}
