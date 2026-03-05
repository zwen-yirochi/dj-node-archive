'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { Loader2 } from 'lucide-react';

import {
    selectContentView,
    selectGoBack,
    selectHasPreviousView,
    selectSetView,
    useDashboardStore,
} from '../../stores/dashboardStore';
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
    const goBack = useDashboardStore(selectGoBack);
    const hasPreviousView = useDashboardStore(selectHasPreviousView);

    const content = (() => {
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
                        <PageListView />
                    </div>
                );

            case 'detail':
                return (
                    <div className="h-full overflow-hidden rounded-2xl">
                        <ErrorBoundaryWithQueryReset>
                            <Suspense fallback={<LoadingSkeleton />}>
                                <EntryDetailView
                                    entryId={view.entryId}
                                    onBack={hasPreviousView ? goBack : undefined}
                                />
                            </Suspense>
                        </ErrorBoundaryWithQueryReset>
                    </div>
                );

            case 'create':
                return (
                    <div className="h-full overflow-hidden rounded-2xl">
                        <CreateEntryPanel type={view.entryType} />
                    </div>
                );
        }
    })();

    return (
        <>
            <div
                key={
                    view.kind === 'detail'
                        ? `detail-${view.entryId}`
                        : view.kind === 'create'
                          ? `create-${view.entryType}`
                          : view.kind
                }
                className="h-full animate-fade-in-view"
            >
                {content}
            </div>
        </>
    );
}
