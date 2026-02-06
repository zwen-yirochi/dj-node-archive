// app/dashboard/page.tsx
import { getUser } from '@/app/actions/auth';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { isSuccess } from '@/types/result';
import { notFound, redirect } from 'next/navigation';
import EditorClient from './EditorClient';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default async function DashboardPage() {
    const authUser = await getUser();

    if (!authUser) {
        redirect('/login');
    }

    let result = await getEditorDataByAuthUserId(authUser.id);

    // 사용자가 없으면 동기화 시도
    if (!result.success && result.error.code === 'NOT_FOUND') {
        const syncResult = await syncUserFromAuth(authUser);
        if (isSuccess(syncResult)) {
            // 동기화 성공 후 다시 조회
            result = await getEditorDataByAuthUserId(authUser.id);
        }
    }

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
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
