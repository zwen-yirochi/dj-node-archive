// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
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
import { type Result, createNotFoundError, failure, isSuccess, success } from '@/types/result';
import { cache } from 'react';

export interface EditorData {
    user: User;
    components: ComponentData[];
    pageId: string | null;
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
        });
    }

    const components = (page.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    return success({
        user,
        components,
        pageId: page.id,
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
        events: page.components.filter((c): c is EventComponent => c.type === 'show'),
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
        });
    }

    const components = (page.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    return success({
        user,
        components,
        pageId: page.id,
    });
});
