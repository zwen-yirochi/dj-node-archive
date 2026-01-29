// hooks/useEditorData.ts
import { ComponentData, User } from '@/types';
import { useEffect, useState } from 'react';

interface EditorData {
    user: User;
    components: ComponentData[];
    pageId: string | null;
}

export function useEditorData(username: string) {
    const [user, setUser] = useState<User | null>(null);
    const [components, setComponents] = useState<ComponentData[]>([]);
    const [pageId, setPageId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!username) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/editor/data?username=${encodeURIComponent(username)}`
                );

                if (!response.ok) {
                    throw new Error('Failed to load editor data');
                }

                const data: EditorData = await response.json();

                setUser(data.user);
                setComponents(data.components);
                setPageId(data.pageId);
            } catch (err) {
                console.error('Error loading editor data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [username]);

    return {
        user,
        setUser,
        components,
        setComponents,
        pageId,
        loading,
        error,
    };
}
