// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import { getViewItemsByPageId, type DBPageViewItem } from '@/lib/db/queries/page-view.queries';
import { findUserWithPages, findUserWithPagesById } from '@/lib/db/queries/user.queries';
import { mapComponentToDomain, mapUserToDomain } from '@/lib/mappers/user.mapper';
import type {
    ComponentData,
    EventComponent,
    LinkComponent,
    MixsetComponent,
    Page,
    User,
} from '@/types/domain';
import type { Theme } from '@/types';
import { type Result, createNotFoundError, failure, isSuccess, success } from '@/types/result';
import { cache } from 'react';

// View Item 도메인 타입
export interface DisplayEntry {
    id: string;
    componentId: string;
    order: number;
    isVisible: boolean;
}

/** @deprecated Use DisplayEntry instead */
export type ViewItem = DisplayEntry;

export interface EditorData {
    user: User;
    components: ComponentData[];
    pageId: string | null;
    viewItems: DisplayEntry[];
    theme: Theme | null;
}

// DB 타입을 도메인 타입으로 변환
function mapViewItemToDomain(dbItem: DBPageViewItem): DisplayEntry {
    return {
        id: dbItem.id,
        componentId: dbItem.component_id,
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
    const components = (dbPage.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    return success({
        id: dbPage.id,
        userId: dbData.id,
        slug: dbPage.slug,
        components,
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
            viewItems: [],
            theme: null,
        });
    }

    const components = (page.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    // View items 조회
    const viewItemsResult = await getViewItemsByPageId(page.id);
    const viewItems = isSuccess(viewItemsResult)
        ? viewItemsResult.data.map(mapViewItemToDomain)
        : [];

    // Theme 매핑
    const theme = (page.theme as unknown as Theme) ?? null;

    return success({
        user,
        components,
        pageId: page.id,
        viewItems,
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
        events: page.components.filter((c): c is EventComponent => c.type === 'event'),
        mixsets: page.components.filter((c): c is MixsetComponent => c.type === 'mixset'),
        links: page.components.filter((c): c is LinkComponent => c.type === 'link'),
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
            viewItems: [],
            theme: null,
        });
    }

    const components = (page.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    // View items 조회
    const viewItemsResult = await getViewItemsByPageId(page.id);
    const viewItems = isSuccess(viewItemsResult)
        ? viewItemsResult.data.map(mapViewItemToDomain)
        : [];

    // Theme 매핑
    const theme = (page.theme as unknown as Theme) ?? null;

    return success({
        user,
        components,
        pageId: page.id,
        viewItems,
        theme,
    });
});

// 공개 페이지용 - View 항목만 조회
export interface PublicPageData {
    user: User;
    components: ComponentData[];
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

        // View items 조회
        const viewItemsResult = await getViewItemsByPageId(page.id);

        if (!isSuccess(viewItemsResult) || viewItemsResult.data.length === 0) {
            // View items가 없으면 기존 방식대로 모든 컴포넌트 반환
            const components = (page.components || [])
                .sort((a, b) => a.position - b.position)
                .map(mapComponentToDomain);

            return success({
                user,
                components,
            });
        }

        // View items가 있으면 해당 컴포넌트만 순서대로 반환
        const viewItems = viewItemsResult.data
            .filter((item) => item.is_visible)
            .sort((a, b) => a.order_index - b.order_index);

        const componentMap = new Map(
            (page.components || []).map((c) => [c.id, mapComponentToDomain(c)])
        );

        const components = viewItems
            .map((item) => componentMap.get(item.component_id))
            .filter((c): c is ComponentData => c !== undefined);

        return success({
            user,
            components,
        });
    }
);
