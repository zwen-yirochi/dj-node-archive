import Background from '@/components/Background';
import ErrorBoundaryWithQueryReset from './components/ErrorBoundary';
import QueryProvider from '@/components/providers/QueryProvider';
import { Suspense } from 'react';
import Skeleton from './components/Skeleton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <Background src="/4fc8c0ade8e627922d94ad85cdf74555.jpg" priority={true}>
                <main className="h-full flex-1 overflow-y-auto font-inter">
                    <ErrorBoundaryWithQueryReset>
                        <Suspense fallback={<Skeleton />}>{children}</Suspense>
                    </ErrorBoundaryWithQueryReset>
                </main>
            </Background>
        </QueryProvider>
    );
}
