// app/dashboard/page.tsx
import { notFound } from 'next/navigation';

import { isSuccess } from '@/types/result';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { getUser } from '@/app/actions/auth';

import ContentPanel from './components/ContentPanel';
import DashboardSettingsModal from './components/DashboardSettingsModal';
import PreviewPanel from './components/PreviewPanel';
import StoreInitializer from './components/StoreInitializer';
import TreeSidebar from './components/TreeSidebar';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default async function DashboardPage() {
    // Data fetching
    const authUser = await getUser();

    let result = await getEditorDataByAuthUserId(authUser!.id);

    if (!result.success && result.error.code === 'NOT_FOUND') {
        const syncResult = await syncUserFromAuth(authUser!);
        if (isSuccess(syncResult)) {
            result = await getEditorDataByAuthUserId(authUser!.id);
        }
    }

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    const initialData = result.data;

    // UI rendering
    return (
        <>
            <StoreInitializer initialData={initialData} />
            <DashboardSettingsModal />

            <div className="flex h-screen overflow-hidden p-3">
                <div className="flex flex-1 overflow-hidden rounded-2xl bg-dashboard-bg-base shadow-lg backdrop-blur-sm">
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
        </>
    );
}
