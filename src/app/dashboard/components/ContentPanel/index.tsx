'use client';

import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { useMemo } from 'react';
import BioDesignPanel from './BioDesignPanel';
import CreateMode from './EditMode/CreateMode';
import EmptyState from './EmptyState';
import InlineEditMode from './InlineEditMode';
import PageListView from './PageListView';

export default function ContentPanel() {
    // UI Store
    const selectedEntryId = useUIStore((state) => state.selectedEntryId);
    const activePanel = useUIStore((state) => state.activePanel);
    const isCreating = useUIStore((state) => state.isCreating);
    const selectEntry = useUIStore((state) => state.selectEntry);
    const finishCreatingUI = useUIStore((state) => state.finishCreating);

    // Content Entry Store
    const entries = useContentEntryStore((state) => state.entries);
    const updateEntry = useContentEntryStore((state) => state.updateEntry);
    const deleteEntry = useContentEntryStore((state) => state.deleteEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);

    // Display Entry Store
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);

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

    // Page 패널 모드
    if (activePanel === 'page') {
        return (
            <div className="h-full overflow-hidden rounded-2xl">
                <PageListView />
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

    // 엔트리 저장 핸들러 (미리보기 트리거 처리)
    const handleSave = async (entry: typeof selectedEntry) => {
        const { triggeredPreview } = await updateEntry(entry);
        if (triggeredPreview) {
            triggerPreviewRefresh();
        }
    };

    // 엔트리 삭제 핸들러 (미리보기 트리거 처리)
    const handleDelete = async () => {
        const { triggeredPreview } = await deleteEntry(selectedEntry.id);
        if (triggeredPreview) {
            triggerPreviewRefresh();
        }
        selectEntry(null);
    };

    // 생성 완료 핸들러 (UIStore + ContentEntryStore 동기화)
    const handleFinishCreating = () => {
        finishCreatingUI();
        finishCreatingEntry(selectedEntry.id);
    };

    // 생성 모드 (새 엔트리) - 별도 유지
    if (isCreating) {
        return (
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <CreateMode
                    component={selectedEntry}
                    onSave={async (entry) => {
                        const { triggeredPreview } = await updateEntry(entry);
                        if (triggeredPreview) {
                            triggerPreviewRefresh();
                        }
                        handleFinishCreating();
                    }}
                    onCancel={async () => {
                        // 생성 취소 시 엔트리 삭제 (미리보기 트리거 없음 - 아직 불완전한 상태)
                        await deleteEntry(selectedEntry.id);
                        handleFinishCreating();
                        selectEntry(null);
                    }}
                />
            </div>
        );
    }

    // 인라인 편집 모드 (View + Edit 통합)
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10">
            <InlineEditMode component={selectedEntry} onSave={handleSave} onDelete={handleDelete} />
        </div>
    );
}
