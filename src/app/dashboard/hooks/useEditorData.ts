import { transformSupabaseToEditor } from '@/lib/editor-utils';
import { getEditableUserPage } from '@/lib/supabase-queries';
import { ComponentData, User } from '@/types';
import { useEffect, useState } from 'react';

// hooks/useEditorData.ts
export function useEditorData(username: string) {
    const [user, setUser] = useState<User | null>(null);
    const [components, setComponents] = useState<ComponentData[]>([]);
    const [pageId, setPageId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const data = await getEditableUserPage(username);
            if (data) {
                const transformed = transformSupabaseToEditor(data);
                if (transformed) {
                    setUser(transformed.user);
                    setComponents(transformed.components);
                    setPageId(transformed.pageId);
                }
            }
            setLoading(false);
        }
        loadData();
    }, [username]);

    return { user, setUser, components, setComponents, pageId, loading };
}
