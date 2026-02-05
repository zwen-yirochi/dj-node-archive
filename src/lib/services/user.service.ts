// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import {
    getDisplayEntriesByPageId,
    type DBDisplayEntry,
} from '@/lib/db/queries/display-entry.queries';
import { findUserWithPages, findUserWithPagesById } from '@/lib/db/queries/user.queries';
import { mapEntryToDomain, mapUserToDomain } from '@/lib/mappers/user.mapper';
import type { Theme } from '@/types';
import type {
    ContentEntry,
    EventComponent,
    LinkComponent,
    MixsetComponent,
    Page,
    User,
} from '@/types/domain';
import { createNotFoundError, failure, isSuccess, success, type Result } from '@/types/result';
import { cache } from 'react';

// View Item 도메인 타입
export interface DisplayEntry {
    id: string;
    entryId: string;
    order: number;
    isVisible: boolean;
}

/** @deprecated Use DisplayEntry instead */
export type ViewItem = DisplayEntry;

export interface EditorData {
    user: User;
    components: ContentEntry[];
    pageId: string | null;
    displayEntries: DisplayEntry[];
    theme: Theme | null;
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
    events: EventComponent[];
    mixsets: MixsetComponent[];
    links: LinkComponent[];
}

export const getUser = cache(async (username: string): Promise<Result<User>> => {
    const result = await findUserWithPages(username);

    if (!result.success) {
        return result;
    }

    return success(mapUserToDomain(result.data));
});

// React cache로 감싸서 요청당 한 번만 실행
export const getUserPage = cache(async (username: string): Promise<Result<Page>> => {
    const result = await findUserWithPages(username);

    if (!isSuccess(result)) {
        return result;
    }

    const dbData = result.data;
    if (!dbData.pages?.[0]) {
        return failure(createNotFoundError(`'${username}'의 페이지를 찾을 수 없습니다.`, 'page'));
    }

    const dbPage = dbData.pages[0];
    const entries = (dbPage.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    return success({
        id: dbPage.id,
        userId: dbData.id,
        slug: dbPage.slug,
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
    const page = dbData.pages?.[0];

    if (!page) {
        return success({
            user,
            components: [],
            pageId: null,
            displayEntries: [],
            theme: null,
        });
    }

    const components = (page.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    // DisplayEntry 조회
    const displayEntriesResult = await getDisplayEntriesByPageId(page.id);
    const displayEntries = isSuccess(displayEntriesResult)
        ? displayEntriesResult.data.map(mapDisplayEntryToDomain)
        : [];

    // Theme 매핑
    const theme = (page.theme as unknown as Theme) ?? null;

    return success({
        user,
        components,
        pageId: page.id,
        displayEntries,
        theme,
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
        events: page.entries.filter((c): c is EventComponent => c.type === 'event'),
        mixsets: page.entries.filter((c): c is MixsetComponent => c.type === 'mixset'),
        links: page.entries.filter((c): c is LinkComponent => c.type === 'link'),
    });
}

// 인증된 사용자 ID로 에디터 데이터 조회
export const getEditorDataByUserId = cache(async (userId: string): Promise<Result<EditorData>> => {
    const result = await findUserWithPagesById(userId);

    if (!isSuccess(result)) {
        return result;
    }

    const dbData = result.data;
    const user = mapUserToDomain(dbData);
    const page = dbData.pages?.[0];

    if (!page) {
        return success({
            user,
            components: [],
            pageId: null,
            displayEntries: [],
            theme: null,
        });
    }

    const components = (page.entries || [])
        .sort((a, b) => a.position - b.position)
        .map(mapEntryToDomain);

    // DisplayEntry 조회
    const displayEntriesResult = await getDisplayEntriesByPageId(page.id);
    const displayEntries = isSuccess(displayEntriesResult)
        ? displayEntriesResult.data.map(mapDisplayEntryToDomain)
        : [];

    // Theme 매핑
    const theme = (page.theme as unknown as Theme) ?? null;

    return success({
        user,
        components,
        pageId: page.id,
        displayEntries,
        theme,
    });
});

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
        const page = dbData.pages?.[0];

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
