// app/dashboard/page.tsx
import { notFound } from 'next/navigation';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { isSuccess } from '@/types/result';
import { syncUserFromAuth } from '@/lib/api/handlers/auth.handlers';
import { getEditorDataByAuthUserId } from '@/lib/services/user.service';
import { getUser } from '@/app/actions/auth';

import Dashboard from './components/Dashboard';
import { entryKeys, pageKeys, userKeys } from './hooks/use-editor-data';

export const metadata = {
    title: 'Editor - Dashboard',
    description: 'Edit your profile and components',
};

export default async function DashboardPage() {
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

    const { user, contentEntries, pageId, pageSettings, sections } = result.data;

    // TanStack Query — prefetch into server-side QueryClient
    const queryClient = new QueryClient();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: entryKeys.all,
            queryFn: () => contentEntries,
        }),
        queryClient.prefetchQuery({
            queryKey: userKeys.all,
            queryFn: () => user,
        }),
        queryClient.prefetchQuery({
            queryKey: pageKeys.all,
            queryFn: () => ({ pageId, pageSettings, sections: sections ?? [] }),
        }),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Dashboard pageId={pageId} />
        </HydrationBoundary>
    );
}
