// app/dashboard/page.tsx
import { getUser } from '@/app/actions/auth';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { isSuccess } from '@/types/result';
import { notFound } from 'next/navigation';
import ContentPanel from './components/ContentPanel';
import PreviewPanel from './components/PreviewPanel';
import StoreInitializer from './components/StoreInitializer';
import TreeSidebar from './components/TreeSidebar';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default async function DashboardPage() {
    // 데이터 페칭
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

    // UI 렌더링
    return (
        <>
            <StoreInitializer initialData={initialData} />

            <div className="flex h-screen overflow-hidden">
                {/* TreeSidebar */}
                <div className="p-3">
                    <TreeSidebar />
                </div>

                {/* Main Content */}
                <div className="flex flex-1 gap-6 overflow-hidden p-3 pl-2">
                    {/* ContentPanel */}
                    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-dashboard-bg-card shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
                        <ContentPanel />
                    </div>

                    {/* PreviewPanel */}
                    <aside className="w-[400px] shrink-0 overflow-hidden">
                        <PreviewPanel />
                    </aside>
                </div>
            </div>
        </>
    );
}
