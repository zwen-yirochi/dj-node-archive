import { supabase } from '@/lib/supabase';

// 사용자 프로필 + 페이지 정보 가져오기
export async function getUserProfile(username: string) {
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

// 컴포넌트를 타입별로 분리하는 헬퍼 함수
export function separateComponentsByType(components: any[]) {
    const events = components
        .filter((c) => c.type === 'show')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...c.data,
        }));

    const mixsets = components
        .filter((c) => c.type === 'mixset')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...c.data,
        }));

    const links = components
        .filter((c) => c.type === 'link')
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
            id: c.id,
            ...c.data,
        }));

    return { events, mixsets, links };
}
