'use client';

import { selectContentView, selectSetView, useDashboardStore } from '../../stores/dashboardStore';
import dynamic from 'next/dynamic';
import ErrorBoundaryWithQueryReset from '../ErrorBoundary';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PageListView from './PageListView';

// 동적 import with 스켈레톤
const BioDesignPanel = dynamic(() => import('./BioDesignPanel'), {
    loading: () => <PanelSkeleton />,
});

const CreateEntryPanel = dynamic(() => import('./CreateEntryPanel'), {
    loading: () => <PanelSkeleton />,
});

const EntryDetailView = dynamic(() => import('./EntryDetailView'), {
    loading: () => <EditorSkeleton />,
});

// 스켈레톤 컴포넌트들
function PanelSkeleton() {
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 rounded-lg bg-white/5" />
                <div className="mt-8 space-y-3">
                    <div className="h-4 w-full rounded bg-white/5" />
                    <div className="h-4 w-5/6 rounded bg-white/5" />
                    <div className="h-4 w-4/6 rounded bg-white/5" />
                </div>
                <div className="mt-8 grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function EditorSkeleton() {
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]">
            <div className="flex h-full animate-pulse flex-col">
                <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-24 rounded-lg bg-white/5" />
                        <div className="h-9 w-24 rounded-lg bg-white/5" />
                        <div className="flex-1" />
                        <div className="h-9 w-20 rounded-lg bg-white/5" />
                    </div>
                </div>
                <div className="flex-1 space-y-4 p-6">
                    <div className="h-10 w-3/4 rounded-lg bg-white/5" />
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded bg-white/5" />
                        <div className="h-4 w-full rounded bg-white/5" />
                        <div className="h-4 w-2/3 rounded bg-white/5" />
                    </div>
                    <div className="mt-6 h-32 w-full rounded-xl bg-white/5" />
                </div>
            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-text-muted" />
        </div>
    );
}

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
                <div className="h-full overflow-hidden rounded-2xl border border-white/10">
                    <ErrorBoundaryWithQueryReset>
                        <Suspense fallback={<DetailSkeleton />}>
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
                <div className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                    <CreateEntryPanel type={view.entryType} />
                </div>
            );
    }
}
