// app/dashboard/EditorClient.tsx
'use client';

import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData, User } from '@/types';
import { useEffect } from 'react';
import { ComponentList } from './components/ComponentList';
import PreviewPanel from './components/PreviewPanel';
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
        <div className="h-screen overflow-hidden bg-surface p-6">
            <div
                className="editor-layout grid h-full gap-6"
                style={{
                    gridTemplateColumns: '1fr 305px',
                }}
            >
                {/* Main Content - 전체 높이, 내부 스크롤 */}
                <main className="flex h-full flex-col overflow-hidden">
                    {/* Profile - 고정 높이, 축소 UI */}
                    <div className="shrink-0 border-b border-border px-6 py-4">
                        <ProfileEditor compact />
                    </div>

                    {/* Content - 나머지 영역, 스크롤 */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <ComponentList />
                    </div>
                </main>

                {/* Preview Panel */}
                <aside className="flex flex-col overflow-hidden">
                    <PreviewPanel />
                </aside>
            </div>
        </div>
    );
}
