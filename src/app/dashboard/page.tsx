// app/dashboard/page.tsx
import { getUser } from '@/app/actions/auth';
import { getEditorDataByUserId } from '@/lib/services/user.service';
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

    const result = await getEditorDataByUserId(authUser.id);

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    const { user, components, pageId } = result.data;

    return (
        <EditorClient initialUser={user} initialComponents={components} pageId={pageId as string} />
    );
}
