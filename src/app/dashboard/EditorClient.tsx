// app/dashboard/EditorClient.tsx
'use client';

import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { useUserStore } from '@/stores/userStore';
import type { ContentEntry, User } from '@/types';
import type { DisplayEntry } from '@/types/domain';
import { useEffect } from 'react';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import TreeSidebar from './components/TreeSidebar';

interface EditorClientProps {
    initialUser: User;
    initialEntries: ContentEntry[];
    initialDisplayEntries?: DisplayEntry[];
    pageId: string;
    username: string;
}

export default function EditorClient({
    initialUser,
    initialEntries,
    initialDisplayEntries = [],
    pageId,
    username,
}: EditorClientProps) {
    // User Store
    const setUser = useUserStore((state) => state.setUser);

    // Content Entry Store
    const setEntries = useContentEntryStore((state) => state.setEntries);
    const setPageId = useContentEntryStore((state) => state.setPageId);
    const deleteEntryFromStore = useContentEntryStore((state) => state.deleteEntry);

    // Display Entry Store
    const setDisplayEntries = useDisplayEntryStore((state) => state.setDisplayEntries);
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);

    // Zustand 초기화
    useEffect(() => {
        setUser(initialUser);
        setEntries(initialEntries);
        setDisplayEntries(initialDisplayEntries);
        setPageId(pageId);
    }, [
        initialUser,
        initialEntries,
        initialDisplayEntries,
        pageId,
        setUser,
        setEntries,
        setDisplayEntries,
        setPageId,
    ]);

    // 엔트리 삭제 핸들러
    const handleDeleteEntry = async (id: string) => {
        const { triggeredPreview } = await deleteEntryFromStore(id);
        if (triggeredPreview) triggerPreviewRefresh();
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* TreeSidebar - 왼쪽 */}
            <div className="p-3">
                <TreeSidebar onDeleteEntry={handleDeleteEntry} username={username} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden p-3 pl-2">
                {/* ContentPanel - 중앙 */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-dashboard-bg-card shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
                    <ContentPanel />
                </div>

                {/* PreviewPanel - 오른쪽 */}
                <aside className="w-[400px] shrink-0 overflow-hidden">
                    <PreviewPanel />
                </aside>
            </div>
        </div>
    );
}
