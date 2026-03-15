// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import { cache } from 'react';

import type { Entry } from '@/types/database';
import {
    isEventEntry,
    isLinkEntry,
    isMixsetEntry,
    type ContentEntry,
    type EventEntry,
    type HeaderStyle,
    type LinkEntry,
    type MixsetEntry,
    type PageSettings,
    type ProfileLink,
    type ResolvedSection,
    type Section,
    type User,
} from '@/types/domain';
import { createNotFoundError, failure, isSuccess, success, type Result } from '@/types/result';
import {
    findUserWithPages,
    findUserWithPagesByAuthId,
    findUserWithPagesById,
} from '@/lib/db/queries/user.queries';
import { mapEntryToDomain, mapUserToDomain } from '@/lib/mappers';

const DEFAULT_PAGE_SETTINGS: PageSettings = { headerStyle: 'minimal', links: [] };

function buildPageSettings(dbPage?: { header_style?: string; links?: unknown[] }): PageSettings {
    return {
        headerStyle: (dbPage?.header_style as HeaderStyle) ?? 'minimal',
        links: (dbPage?.links as ProfileLink[]) ?? [],
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
    sections: Section[];
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
            sections: [],
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
        sections: parseSections(page.sections),
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
        events: page.entries.filter(isEventEntry),
        mixsets: page.entries.filter(isMixsetEntry),
        links: page.entries.filter(isLinkEntry),
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
                sections: [],
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
            sections: parseSections(page.sections),
        });
    }
);

// 공개 페이지용 - sections 기반 조회
export interface PublicPageData {
    user: User;
    sections: ResolvedSection[];
    pageSettings: PageSettings;
}

function parseSections(raw: unknown): Section[] {
    if (!Array.isArray(raw)) return [];
    return raw as Section[];
}

function resolveSections(sections: Section[], dbEntries: Entry[]): ResolvedSection[] {
    const entryMap = new Map(dbEntries.map((e) => [e.id, e]));

    return sections
        .filter((s) => s.isVisible)
        .map((section) => ({
            id: section.id,
            viewType: section.viewType,
            title: section.title,
            entries: section.entryIds
                .map((id) => entryMap.get(id))
                .filter((e): e is Entry => e !== undefined)
                .map(mapEntryToDomain),
            options: section.options,
        }));
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
                sections: [],
                pageSettings: DEFAULT_PAGE_SETTINGS,
            });
        }

        const sections = resolveSections(parseSections(page.sections), page.entries || []);

        return success({
            user,
            sections,
            pageSettings: buildPageSettings(page),
        });
    }
);
