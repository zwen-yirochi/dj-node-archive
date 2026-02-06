'use client';

import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
import { useMemo } from 'react';
import BioDesignPanel from './BioDesignPanel';
import CreateEntryPanel from './CreateEntryPanel';
import EmptyState from './EmptyState';
import InlineEditMode from './InlineEditMode';
import PageListView from './PageListView';

export default function ContentPanel() {
    // UI Store
    const selectedEntryId = useUIStore((state) => state.selectedEntryId);
    const activePanel = useUIStore((state) => state.activePanel);
    const createPanelType = useUIStore((state) => state.createPanelType);
    const selectEntry = useUIStore((state) => state.selectEntry);
    const finishCreatingUI = useUIStore((state) => state.finishCreating);

    // Content Entry Store
    const entries = useContentEntryStore((state) => state.entries);
    const updateEntry = useContentEntryStore((state) => state.updateEntry);
    const deleteEntry = useContentEntryStore((state) => state.deleteEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);
    const triggerPreviewRefresh = useContentEntryStore((state) => state.triggerPreviewRefresh);

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

    // 생성 패널 모드 (새로운 방식)
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

    // 인라인 편집 모드 (View + Edit 통합)
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-white/10">
            <InlineEditMode component={selectedEntry} onSave={handleSave} onDelete={handleDelete} />
        </div>
    );
}
