// lib/services/user.service.ts
// 서버 전용 - 'use server' 없어도 됨 (기본이 서버)
import { findUserWithPages } from '@/lib/db/queries/user.queries';
import { mapComponentToDomain, mapUserToDomain } from '@/lib/mappers/user.mapper';
import type { ComponentData, Page, User } from '@/types/domain';
import { cache } from 'react';

export interface EditorData {
    user: User;
    components: ComponentData[];
    pageId: string | null;
}

// React cache로 감싸서 요청당 한 번만 실행
export const getUserPage = cache(async (username: string): Promise<Page | null> => {
    const dbData = await findUserWithPages(username);
    if (!dbData || !dbData.pages?.[0]) return null;

    const dbPage = dbData.pages[0];
    const components = (dbPage.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    return {
        id: dbPage.id,
        userId: dbData.id,
        slug: dbPage.slug,
        components,
    };
});

export const getEditorData = cache(async (username: string): Promise<EditorData | null> => {
    const dbData = await findUserWithPages(username);
    if (!dbData) return null;

    const user = mapUserToDomain(dbData);
    const page = dbData.pages?.[0];

    if (!page) {
        return {
            user,
            components: [],
            pageId: null,
        };
    }

    const components = (page.components || [])
        .sort((a, b) => a.position - b.position)
        .map(mapComponentToDomain);

    return {
        user,
        components,
        pageId: page.id,
    };
});

// 타입별 필터링이 필요하면
export async function getComponentsByType(username: string) {
    const page = await getUserPage(username);
    if (!page) return null;

    return {
        events: page.components.filter((c) => c.type === 'show'),
        mixsets: page.components.filter((c) => c.type === 'mixset'),
        links: page.components.filter((c) => c.type === 'link'),
    };
}
