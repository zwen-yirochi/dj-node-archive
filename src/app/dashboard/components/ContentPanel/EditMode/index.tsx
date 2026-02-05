'use client';

import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { canAddToView, canCreate, getMissingFieldLabels } from '@/lib/validators';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { type ContentEntry, isEventComponent, isLinkComponent, isMixsetComponent } from '@/types';
import {
    AlertCircle,
    Calendar,
    Check,
    Headphones,
    Link as LinkIcon,
    Loader2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LinkEditor from './LinkEditor';
import MixsetEditor from './MixsetEditor';
import ShowEditor from './ShowEditor';

interface EditModeProps {
    component: ContentEntry;
    onSave: (entry: ContentEntry) => Promise<void>;
    onCancel: () => void;
}

/** 자동 저장 딜레이 (ms) */
const AUTO_SAVE_DELAY = 800;

/**
 * 편집 모드 - 기존 엔트리 수정 시 사용
 * - 저장 버튼 없음 (자동 저장)
 * - 디바운스로 변경사항 자동 저장
 * - View 무결성 검사
 */
export default function EditMode({ component, onSave, onCancel }: EditModeProps) {
    const [localEntry, setLocalEntry] = useState<ContentEntry>(component);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isFirstRender = useRef(true);

    // Display Entry Store
    const isInView = useDisplayEntryStore((state) => state.isInView);
    const removeFromViewByEntryId = useDisplayEntryStore((state) => state.removeFromViewByEntryId);

    // 저장 로직
    const saveEntry = useCallback(
        async (entry: ContentEntry) => {
            // create tier 검증 실패 시 저장하지 않음
            if (!canCreate(entry)) {
                return;
            }

            // View에 있는 엔트리인 경우 View 검증
            if (isInView(entry.id)) {
                if (!canAddToView(entry)) {
                    const missingFields = getMissingFieldLabels(entry, 'view');
                    toast({
                        variant: 'destructive',
                        title: 'Page에서 제거됨',
                        description: `필수 필드 누락: ${missingFields.join(', ')}`,
                    });
                    await removeFromViewByEntryId(entry.id);
                }
            }

            setSaveStatus('saving');
            try {
                await onSave(entry);
                setSaveStatus('saved');
                // 2초 후 상태 초기화
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('저장 실패:', error);
                setSaveStatus('idle');
                toast({
                    variant: 'destructive',
                    title: '저장 실패',
                    description: '엔트리를 저장하는 중 오류가 발생했습니다.',
                });
            }
        },
        [isInView, removeFromViewByEntryId, onSave]
    );

    // 디바운스된 저장 함수
    const debouncedSave = useDebounce(saveEntry, AUTO_SAVE_DELAY);

    // 로컬 상태 업데이트 및 자동 저장 트리거
    const updateLocal = (updates: Partial<ContentEntry>) => {
        setLocalEntry((prev) => {
            const updated = { ...prev, ...updates } as ContentEntry;
            // 디바운스된 저장 트리거
            debouncedSave(updated);
            return updated;
        });
    };

    // 엔트리가 변경되면 로컬 상태 업데이트 (다른 엔트리 선택 시)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setLocalEntry(component);
        setSaveStatus('idle');
    }, [component.id]); // id가 변경될 때만

    const getEntryIcon = () => {
        switch (localEntry.type) {
            case 'event':
                return <Calendar className="h-5 w-5" />;
            case 'mixset':
                return <Headphones className="h-5 w-5" />;
            case 'link':
                return <LinkIcon className="h-5 w-5" />;
        }
    };

    const getEntryTitle = () => {
        switch (localEntry.type) {
            case 'event':
                return '공연 편집';
            case 'mixset':
                return '믹스셋 편집';
            case 'link':
                return '링크 편집';
        }
    };

    // View 상태
    const isViewReady = canAddToView(localEntry);
    const entryIsInView = isInView(localEntry.id);
    const missingFields = !isViewReady ? getMissingFieldLabels(localEntry, 'view') : [];

    const typeStyles = {
        event: 'bg-blue-50 text-dashboard-type-event',
        mixset: 'bg-purple-50 text-dashboard-type-mixset',
        link: 'bg-green-50 text-dashboard-type-link',
    };

    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeStyles[localEntry.type]}`}
                    >
                        {getEntryIcon()}
                    </div>
                    <h2 className="text-xl font-semibold text-dashboard-text">{getEntryTitle()}</h2>

                    {/* 저장 상태 표시 */}
                    <div className="flex items-center gap-1.5 text-sm">
                        {saveStatus === 'saving' && (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-dashboard-text-muted" />
                                <span className="text-dashboard-text-muted">저장 중...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-green-500">저장됨</span>
                            </>
                        )}
                    </div>

                    {/* View 상태 경고 아이콘 */}
                    {!isViewReady && (
                        <Tooltip
                            content={
                                entryIsInView
                                    ? `Page에서 제거 예정 - 필드를 채워주세요: ${missingFields.join(', ')}`
                                    : `Page에 추가하려면: ${missingFields.join(', ')}`
                            }
                            delay={300}
                        >
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        </Tooltip>
                    )}
                </div>

                {/* 닫기 버튼 (오른쪽 위) */}
                <button
                    onClick={onCancel}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-dashboard-text-muted transition-colors hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isEventComponent(localEntry) && (
                    <ShowEditor component={localEntry} onUpdate={updateLocal} />
                )}
                {isMixsetComponent(localEntry) && (
                    <MixsetEditor component={localEntry} onUpdate={updateLocal} />
                )}
                {isLinkComponent(localEntry) && (
                    <LinkEditor component={localEntry} onUpdate={updateLocal} />
                )}
            </div>
        </div>
    );
}
