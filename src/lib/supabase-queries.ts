import { supabase } from '@/lib/supabase';
import type { Component, EventData, MixsetData, LinkData, UserWithPages } from '@/types/database';

// 사용자 프로필 + 페이지 정보 가져오기
export async function getUserProfile(username: string): Promise<UserWithPages | null> {
    const { data, error } = await supabase
        .from('users')
        .select(
            `
      *,
      pages (
        *,
        components (
          id,
          type,
          position,
          data,
          created_at
        )
      )
    `
        )
        .eq('username', username)
        .single();
    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data;
}

// 에디터용 타입 정의
export interface EditableUserPage {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    pages: {
        id: string;
        slug: string;
        template_type: string | null;
        theme: unknown;
        components: Pick<Component, 'id' | 'type' | 'position' | 'data' | 'created_at'>[];
    }[];
}

// 에디터용: 사용자 페이지 전체 데이터 가져오기 (수정 가능한 형태)
export async function getEditableUserPage(username: string): Promise<EditableUserPage | null> {
    const { data, error } = await supabase
        .from('users')
        .select(
            `
      id,
      username,
      display_name,
      avatar_url,
      bio,
      pages (
        id,
        slug,
        template_type,
        theme,
        components (
          id,
          type,
          position,
          data,
          created_at
        )
      )
    `
        )
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error fetching editable page:', error);
        return null;
    }

    return data;
}

// 분리된 컴포넌트 결과 타입
export interface SeparatedComponents {
    events: (EventData & { id: string })[];
    mixsets: (MixsetData & { id: string })[];
    links: (LinkData & { id: string })[];
}

// 컴포넌트를 타입별로 분리하는 헬퍼 함수
export function separateComponentsByType(components: Component[]): SeparatedComponents {
    const events = components
        .filter((c) => c.type === 'show')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...(c.data as EventData),
        }));

    const mixsets = components
        .filter((c) => c.type === 'mixset')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...(c.data as MixsetData),
        }));

    const links = components
        .filter((c) => c.type === 'link')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...(c.data as LinkData),
        }));

    return { events, mixsets, links };
}
