'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { Loader2 } from 'lucide-react';

import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import ErrorBoundaryWithQueryReset from '../ErrorBoundary';
import PageListView from './PageListView';

function LoadingSkeleton() {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-text-muted" />
        </div>
    );
}

const BioDesignPanel = dynamic(() => import('./BioDesignPanel'), {
    loading: () => <LoadingSkeleton />,
});

const CreateEntryPanel = dynamic(() => import('./CreateEntryPanel'), {
    loading: () => <LoadingSkeleton />,
});

const EntryDetailView = dynamic(() => import('./EntryDetailView'), {
    loading: () => <LoadingSkeleton />,
});

export default function ContentPanel() {
    const view = useDashboardStore(selectContentView);
    const setView = useDashboardStore(selectSetView);

    switch (view.kind) {
        case 'bio':
            return (
                <div className="h-full overflow-hidden rounded-2xl">
                    <BioDesignPanel />
                </div>
            );

        case 'page':
            return (
                <div className="h-full overflow-hidden rounded-2xl">
                    <PageListView
                        onSelectDetail={(id) => setView({ kind: 'page-detail', entryId: id })}
                    />
                </div>
            );

        case 'page-detail':
        case 'detail':
            return (
                <div className="h-full overflow-hidden rounded-2xl border border-dashboard-border">
                    <ErrorBoundaryWithQueryReset>
                        <Suspense fallback={<LoadingSkeleton />}>
                            <EntryDetailView
                                entryId={view.entryId}
                                onBack={() => setView({ kind: 'page' })}
                            />
                        </Suspense>
                    </ErrorBoundaryWithQueryReset>
                </div>
            );

        case 'create':
            return (
                <div className="h-full overflow-hidden rounded-2xl border border-dashboard-border shadow-xl">
                    <CreateEntryPanel type={view.entryType} />
                </div>
            );
    }
}
