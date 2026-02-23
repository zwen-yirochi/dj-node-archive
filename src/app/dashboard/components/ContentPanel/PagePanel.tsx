'use client';

import ErrorBoundaryWithQueryReset from '../ErrorBoundary';
import { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';
import EntryDetailView from './EntryDetailView';
import PageListView from './PageListView';

function DetailSkeleton() {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-text-muted" />
        </div>
    );
}

export default function PagePanel() {
    const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

    if (detailEntryId) {
        return (
            <ErrorBoundaryWithQueryReset>
                <Suspense fallback={<DetailSkeleton />}>
                    <EntryDetailView
                        entryId={detailEntryId}
                        onBack={() => setDetailEntryId(null)}
                    />
                </Suspense>
            </ErrorBoundaryWithQueryReset>
        );
    }

    return <PageListView onSelectDetail={setDetailEntryId} />;
}
