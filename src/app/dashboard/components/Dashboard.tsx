// app/dashboard/components/Dashboard.tsx
'use client';

import { useEffect } from 'react';

import { useDashboardStore } from '../stores/dashboardStore';
import ContentPanel from './ContentPanel';
import DashboardDndProvider from './DashboardDndProvider';
import TreeSidebar from './TreeSidebar';
import DashboardSettingsModal from './ui/DashboardSettingsModal';
import PreviewPanel from './ui/PreviewPanel';

interface DashboardProps {
    pageId: string | null;
}

export default function Dashboard({ pageId }: DashboardProps) {
    useEffect(() => {
        useDashboardStore.getState().reset();
        useDashboardStore.getState().setPageId(pageId);
    }, [pageId]);

    return (
        <>
            <DashboardSettingsModal />

            <DashboardDndProvider>
                <div className="flex h-screen overflow-hidden">
                    <div className="flex flex-1 overflow-hidden bg-dashboard-bg-base">
                        {/* TreeSidebar */}
                        <TreeSidebar />

                        {/* Main Content */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* ContentPanel */}
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <ContentPanel />
                            </div>

                            {/* PreviewPanel */}
                            <aside className="w-[400px] shrink-0 overflow-hidden">
                                <PreviewPanel />
                            </aside>
                        </div>
                    </div>
                </div>
            </DashboardDndProvider>
        </>
    );
}
