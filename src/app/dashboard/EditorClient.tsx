// app/dashboard/EditorClient.tsx
'use client';

import { initializeContentEntryStore, useContentEntryStore } from '@/stores/contentEntryStore';
import { useUserStore } from '@/stores/userStore';
import type { ContentEntry, User } from '@/types';
import { useEffect } from 'react';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import TreeSidebar from './components/TreeSidebar';

interface EditorClientProps {
    initialUser: User;
    initialEntries: ContentEntry[];
    pageId: string;
    username: string;
}

export default function EditorClient({
    initialUser,
    initialEntries,
    pageId,
    username,
}: EditorClientProps) {
    // Store 상태 직접 확인 (hook 사용 안 함)
    const currentPageId = useContentEntryStore.getState().pageId;

    // pageId가 없거나 다르면 초기화
    if (currentPageId !== pageId) {
        useUserStore.setState({ user: initialUser });
        initializeContentEntryStore({ entries: initialEntries, pageId });
    }

    // Content Entry Store
    const deleteEntryFromStore = useContentEntryStore((state) => state.deleteEntry);
    const triggerPreviewRefresh = useContentEntryStore((state) => state.triggerPreviewRefresh);

    // props 변경 시 업데이트
    useEffect(() => {
        useUserStore.setState({ user: initialUser });
        initializeContentEntryStore({ entries: initialEntries, pageId });
    }, [initialUser, initialEntries, pageId]);

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
