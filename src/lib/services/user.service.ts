// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import { cache } from 'react';

import type {
    ContentEntry,
    EventEntry,
    HeaderStyle,
    LinkEntry,
    MixsetEntry,
    PageSettings,
    User,
} from '@/types/domain';
import { createNotFoundError, failure, isSuccess, success, type Result } from '@/types/result';
import {
    findUserWithPages,
    findUserWithPagesByAuthId,
    findUserWithPagesById,
} from '@/lib/db/queries/user.queries';
import { mapEntryToDomain, mapUserToDomain } from '@/lib/mappers';

const DEFAULT_PAGE_SETTINGS: PageSettings = { headerStyle: 'minimal' };

function buildPageSettings(dbPage?: { header_style?: string }): PageSettings {
    return {
        headerStyle: (dbPage?.header_style as HeaderStyle) ?? 'minimal',
    };
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
    pageSettings: PageSettings;
    entries: ContentEntry[];
}

export interface EditorData {
    user: User;
    contentEntries: ContentEntry[];
    pageId: string | null;
    pageSettings: PageSettings;
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
        pageSettings: buildPageSettings(dbPage),
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
            pageSettings: DEFAULT_PAGE_SETTINGS,
        });
    }

    const contentEntries = (page.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    return success({
        user,
        contentEntries,
        pageId: page.id,
        pageSettings: buildPageSettings(page),
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
                pageSettings: DEFAULT_PAGE_SETTINGS,
            });
        }

        const contentEntries = (page.entries || [])
            .sort((a, b) => a.position - b.position)
            .map(mapEntryToDomain);

        return success({
            user,
            contentEntries,
            pageId: page.id,
            pageSettings: buildPageSettings(page),
        });
    }
);

// 공개 페이지용 - is_visible = true인 엔트리만 조회
export interface PublicPageData {
    user: User;
    components: ContentEntry[];
    pageSettings: PageSettings;
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
                pageSettings: DEFAULT_PAGE_SETTINGS,
            });
        }

        // is_visible = true이고 display_order가 있는 엔트리만 display_order 순으로 반환
        const components = (page.entries || [])
            .filter((entry) => entry.is_visible && entry.display_order !== null)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map(mapEntryToDomain);

        return success({
            user,
            components,
            pageSettings: buildPageSettings(page),
        });
    }
);
