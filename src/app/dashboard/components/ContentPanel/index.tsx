'use client';

import { useEditorData, useDeleteEntry, useUpdateEntry } from '@/hooks/use-entries';
import { shouldTriggerPreview } from '@/lib/previewTrigger';
import { canAddToView } from '@/lib/validators';
import { useDashboardUIStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import EmptyState from './EmptyState';
import PageListView from './PageListView'; // 디폴트 뷰는 static import

// 동적 import with 스켈레톤
const BioDesignPanel = dynamic(() => import('./BioDesignPanel'), {
    loading: () => <PanelSkeleton />,
});

const CreateEntryPanel = dynamic(() => import('./CreateEntryPanel'), {
    loading: () => <PanelSkeleton />,
});

const InlineEditMode = dynamic(() => import('./InlineEditMode'), {
    loading: () => <EditorSkeleton />,
});

// 스켈레톤 컴포넌트들
function PanelSkeleton() {
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="animate-pulse space-y-4">
                {/* 헤더 */}
                <div className="h-8 w-48 rounded-lg bg-white/5" />

                {/* 컨텐츠 영역 */}
                <div className="mt-8 space-y-3">
                    <div className="h-4 w-full rounded bg-white/5" />
                    <div className="h-4 w-5/6 rounded bg-white/5" />
                    <div className="h-4 w-4/6 rounded bg-white/5" />
                </div>

                {/* 카드들 */}
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
                {/* 툴바 */}
                <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-24 rounded-lg bg-white/5" />
                        <div className="h-9 w-24 rounded-lg bg-white/5" />
                        <div className="flex-1" />
                        <div className="h-9 w-20 rounded-lg bg-white/5" />
                    </div>
                </div>

                {/* 에디터 영역 */}
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

export default function ContentPanel() {
    // UI Store
    const selectedEntryId = useUIStore((state) => state.selectedEntryId);
    const activePanel = useUIStore((state) => state.activePanel);
    const createPanelType = useUIStore((state) => state.createPanelType);
    const selectEntry = useUIStore((state) => state.selectEntry);

    // TanStack Query
    const { data } = useEditorData();
    const entries = data.contentEntries;
    const updateEntryMutation = useUpdateEntry();
    const deleteEntryMutation = useDeleteEntry();

    // Dashboard UI Store
    const triggerPreviewRefresh = useDashboardUIStore((state) => state.triggerPreviewRefresh);

    // useMemo로 선택된 엔트리 찾기
    const selectedEntry = useMemo(() => {
        if (!selectedEntryId) return null;
        return entries.find((e) => e.id === selectedEntryId) ?? null;
    }, [selectedEntryId, entries]);

    // Bio design 패널 모드
    if (activePanel === 'bio') {
        return (
            <div className="h-full overflow-hidden rounded-2xl">
                <BioDesignPanel />
            </div>
        );
    }

    // Page 패널 모드 (디폴트 뷰 - static import)
    if (activePanel === 'page') {
        return (
            <div className="h-full overflow-hidden rounded-2xl">
                <PageListView />
            </div>
        );
    }

    // 생성 패널 모드
    if (createPanelType) {
        return (
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <CreateEntryPanel type={createPanelType} />
            </div>
        );
    }

    // 선택된 엔트리가 없으면 EmptyState
    if (!selectedEntry) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl">
                <EmptyState />
            </div>
        );
    }

    // 엔트리 저장 핸들러
    const handleSave = async (entry: typeof selectedEntry) => {
        const previousEntry = entries.find((e) => e.id === entry.id);
        await updateEntryMutation.mutateAsync({ entry });
        if (previousEntry && shouldTriggerPreview(previousEntry, entry)) {
            triggerPreviewRefresh();
        }
    };

    // 엔트리 삭제 핸들러
    const handleDelete = async () => {
        const shouldRefresh = canAddToView(selectedEntry);
        await deleteEntryMutation.mutateAsync(selectedEntry.id);
        if (shouldRefresh) {
            triggerPreviewRefresh();
        }
        selectEntry(null);
    };

    // 인라인 편집 모드
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10">
            <InlineEditMode component={selectedEntry} onSave={handleSave} onDelete={handleDelete} />
        </div>
    );
}
