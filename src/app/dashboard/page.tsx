// app/dashboard/page.tsx
import { getUser } from '@/app/actions/auth';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { isSuccess } from '@/types/result';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import EditorClient from './EditorClient';
import DashboardSkeleton from './components/DashboardSkeleton';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}

async function DashboardContent() {
    const startTime = Date.now();

    const authUser = await getUser();
    if (!authUser) {
        redirect('/login');
    }

    let result = await getEditorDataByAuthUserId(authUser.id);

    if (!result.success && result.error.code === 'NOT_FOUND') {
        const syncResult = await syncUserFromAuth(authUser);
        if (isSuccess(syncResult)) {
            result = await getEditorDataByAuthUserId(authUser.id);
        }
    }

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    // ⏱️ 개발 중: 스켈레톤 최소 표시 시간 보장
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
    }

    const { user, contentEntries, pageId } = result.data;

    return (
        <EditorClient
            initialUser={user}
            initialEntries={contentEntries}
            pageId={pageId as string}
            username={user.username}
        />
    );
}
