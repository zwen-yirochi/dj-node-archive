import { ComponentData, User } from '@/types';

// Supabase 데이터를 에디터 형식으로 변환
export function transformSupabaseToEditor(supabaseData: any) {
    if (!supabaseData) return null;

    // User 데이터
    const user: User = {
        id: supabaseData.id,
        username: supabaseData.username,
        displayName: supabaseData.display_name || supabaseData.username,
        bio: supabaseData.bio || '',
        avatarUrl: supabaseData.avatar_url || '',
    };

    // Components 데이터
    const components: ComponentData[] = [];

    if (supabaseData.pages?.[0]?.components) {
        const rawComponents = supabaseData.pages[0].components;

        // position 순서대로 정렬
        const sorted = [...rawComponents].sort((a, b) => a.position - b.position);

        sorted.forEach((comp) => {
            const componentData = { ...comp.data };
            delete componentData.id; // data의 id 삭제

            const baseComponent = {
                id: comp.id, // Supabase UUID
                type: comp.type,
                ...componentData,
            };

            components.push(baseComponent as ComponentData);
        });
    }

    const pageId = supabaseData.pages?.[0]?.id || null;

    return {
        user,
        components,
        pageId, // 나중에 저장할 때 필요
    };
}
