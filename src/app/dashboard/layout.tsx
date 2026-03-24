import { Suspense } from 'react';

import QueryProvider from '@/components/providers/QueryProvider';

import ErrorBoundaryWithQueryReset from './components/ErrorBoundary';
import Skeleton from './components/Skeleton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <main className="h-screen overflow-hidden bg-neutral-200 font-inter">
                <ErrorBoundaryWithQueryReset>
                    <Suspense fallback={<Skeleton />}>{children}</Suspense>
                </ErrorBoundaryWithQueryReset>
            </main>
        </QueryProvider>
    );
}
