// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import {
    getDisplayEntriesByPageId,
    type DBDisplayEntry,
} from '@/lib/db/queries/display-entry.queries';
import {
    findUserWithPages,
    findUserWithPagesById,
    findUserWithPagesByAuthId,
} from '@/lib/db/queries/user.queries';
import { mapEntryToDomain, mapUserToDomain } from '@/lib/mappers';
import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry, User } from '@/types/domain';
import { createNotFoundError, failure, isSuccess, success, type Result } from '@/types/result';
import { cache } from 'react';

// DisplayEntry 도메인 타입
export interface DisplayEntry {
    id: string;
    entryId: string;
    order: number;
    isVisible: boolean;
}

// 페이지와 엔트리를 포함한 도메인 타입
export interface PageWithEntries {
    id: string;
    userId: string;
    slug: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    themeColor?: string;
    entries: ContentEntry[];
}

export interface EditorData {
    user: User;
    contentEntries: ContentEntry[];
    pageId: string | null;
    displayEntries: DisplayEntry[];
}

// DB 타입을 도메인 타입으로 변환
function mapDisplayEntryToDomain(dbItem: DBDisplayEntry): DisplayEntry {
    return {
        id: dbItem.id,
        entryId: dbItem.entry_id,
        order: dbItem.order_index,
        isVisible: dbItem.is_visible,
    };
}

export interface ComponentsByType {
    events: EventEntry[];
    mixsets: MixsetEntry[];
    links: LinkEntry[];
}

export const getUser = cache(async (username: string): Promise<Result<User>> => {
    const result = await findUserWithPages(username);

    if (!result.success) {
        return result;
    }

    return success(mapUserToDomain(result.data));
});

// Helper: pages가 배열 또는 단일 객체일 수 있음
function getFirstPage<T>(pages: T[] | T | null | undefined): T | undefined {
    if (!pages) return undefined;
    return Array.isArray(pages) ? pages[0] : pages;
}

// React cache로 감싸서 요청당 한 번만 실행
export const getUserPage = cache(async (username: string): Promise<Result<PageWithEntries>> => {
    const result = await findUserWithPages(username);

    if (!isSuccess(result)) {
        return result;
    }

    const dbData = result.data;
    const dbPage = getFirstPage(dbData.pages);

    if (!dbPage) {
        return failure(createNotFoundError(`'${username}'의 페이지를 찾을 수 없습니다.`, 'page'));
    }

    const entries = (dbPage.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    return success({
        id: dbPage.id,
        userId: dbData.id,
        slug: dbPage.slug,
        title: dbPage.title ?? undefined,
        bio: dbPage.bio ?? undefined,
        avatarUrl: dbPage.avatar_url ?? undefined,
        themeColor: dbPage.theme_color ?? undefined,
        entries,
    });
});

export const getEditorData = cache(async (username: string): Promise<Result<EditorData>> => {
    const result = await findUserWithPages(username);

    if (!isSuccess(result)) {
        return result;
    }

    const dbData = result.data;
    const user = mapUserToDomain(dbData);
    const page = getFirstPage(dbData.pages);

    if (!page) {
        return success({
            user,
            contentEntries: [],
            pageId: null,
            displayEntries: [],
        });
    }

    const contentEntries = (page.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    // DisplayEntry 조회
    const displayEntriesResult = await getDisplayEntriesByPageId(page.id);
    const displayEntries = isSuccess(displayEntriesResult)
        ? displayEntriesResult.data.map(mapDisplayEntryToDomain)
        : [];

    return success({
        user,
        contentEntries,
        pageId: page.id,
        displayEntries,
    });
});

// 타입별 필터링
export async function getComponentsByType(username: string): Promise<Result<ComponentsByType>> {
    const result = await getUserPage(username);

    if (!isSuccess(result)) {
        return result;
    }

    const page = result.data;
    return success({
        events: page.entries.filter((c): c is EventEntry => c.type === 'event'),
        mixsets: page.entries.filter((c): c is MixsetEntry => c.type === 'mixset'),
        links: page.entries.filter((c): c is LinkEntry => c.type === 'link'),
    });
}

// 인증된 사용자 Auth ID로 에디터 데이터 조회
export const getEditorDataByAuthUserId = cache(
    async (authUserId: string): Promise<Result<EditorData>> => {
        const result = await findUserWithPagesByAuthId(authUserId);

        if (!isSuccess(result)) {
            return result;
        }

        const dbData = result.data;
        const user = mapUserToDomain(dbData);

        const page = getFirstPage(dbData.pages);

        if (!page) {
            return success({
                user,
                contentEntries: [],
                pageId: null,
                displayEntries: [],
            });
        }

        const contentEntries = (page.entries || [])
            .sort((a, b) => a.position - b.position)
            .map(mapEntryToDomain);

        // DisplayEntry 조회
        const displayEntriesResult = await getDisplayEntriesByPageId(page.id);
        const displayEntries = isSuccess(displayEntriesResult)
            ? displayEntriesResult.data.map(mapDisplayEntryToDomain)
            : [];

        return success({
            user,
            contentEntries,
            pageId: page.id,
            displayEntries,
        });
    }
);

// 공개 페이지용 - DisplayEntry 항목만 조회
export interface PublicPageData {
    user: User;
    components: ContentEntry[];
}

export const getPublicPageData = cache(
    async (username: string): Promise<Result<PublicPageData>> => {
        const result = await findUserWithPages(username);

        if (!isSuccess(result)) {
            return result;
        }

        const dbData = result.data;
        const user = mapUserToDomain(dbData);
        const page = getFirstPage(dbData.pages);

        if (!page) {
            return success({
                user,
                components: [],
            });
        }

        // DisplayEntry 조회
        const displayEntriesResult = await getDisplayEntriesByPageId(page.id);

        if (!isSuccess(displayEntriesResult) || displayEntriesResult.data.length === 0) {
            // DisplayEntry가 없으면 기존 방식대로 모든 컴포넌트 반환
            const components = (page.entries || [])
                .sort((a, b) => a.position - b.position)
                .map(mapEntryToDomain);

            return success({
                user,
                components,
            });
        }

        // DisplayEntry가 있으면 해당 컴포넌트만 순서대로 반환
        const displayEntries = displayEntriesResult.data
            .filter((item) => item.is_visible)
            .sort((a, b) => a.order_index - b.order_index);

        const componentMap = new Map((page.entries || []).map((c) => [c.id, mapEntryToDomain(c)]));

        const components = displayEntries
            .map((item) => componentMap.get(item.entry_id))
            .filter((c): c is ContentEntry => c !== undefined);

        return success({
            user,
            components,
        });
    }
);
