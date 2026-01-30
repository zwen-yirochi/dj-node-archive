// app/dashboard/EditorClient.tsx
'use client';

import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData, User } from '@/types';
import { useEffect } from 'react';
import { ComponentList } from './components/ComponentList';
import { Header } from './components/Header';
import ProfileEditor from './components/ProfileEditor';

interface EditorClientProps {
    initialUser: User;
    initialComponents: ComponentData[];
    pageId: string;
}

export default function EditorClient({
    initialUser,
    initialComponents,
    pageId,
}: EditorClientProps) {
    const setUser = useEditorStore((state) => state.setUser);
    const setComponents = useEditorStore((state) => state.setComponents);
    const setPageId = useEditorStore((state) => state.setPageId);

    // Zustand 초기화
    useEffect(() => {
        setUser(initialUser);
        setComponents(initialComponents);
        setPageId(pageId);
    }, [initialUser, initialComponents, pageId, setUser, setComponents, setPageId]);

    return (
        <div className="min-h-screen bg-stone-200 p-8 text-shadow-none">
            <Header />

            <div
                className="editor-layout grid gap-6"
                style={{
                    gridTemplateColumns: '1fr 380px',
                    minHeight: 'calc(100vh - 4rem)',
                }}
            >
                {/* Main Content */}
                <main className="overflow-y-auto rounded-lg bg-stone-100 p-8">
                    <ProfileEditor />
                    <ComponentList />
                </main>

                {/* Preview Panel */}
                <aside className="overflow-y-auto rounded-lg border-2 border-dashed border-stone-400 bg-stone-50 p-8">
                    <div className="flex h-full items-center justify-center">
                        <p className="text-stone-500">Preview (Coming Soon)</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
