// app/dashboard/page.tsx
import { getEditorData } from '@/lib/services/user.service';
import { notFound } from 'next/navigation';
import EditorClient from './EditorClient';

const EDIT_USERNAME = 'dj-xxx';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default async function DashboardPage() {
    const result = await getEditorData(EDIT_USERNAME);

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
