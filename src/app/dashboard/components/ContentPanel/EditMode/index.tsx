'use client';

import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { canAddToView, canCreate, getMissingFieldLabels } from '@/lib/validators';
import { useViewStore } from '@/stores/viewStore';
import { type ComponentData, isEventComponent, isLinkComponent, isMixsetComponent } from '@/types';
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
    component: ComponentData;
    onSave: (component: ComponentData) => Promise<void>;
    onCancel: () => void;
}

/** 자동 저장 딜레이 (ms) */
const AUTO_SAVE_DELAY = 800;

/**
 * 편집 모드 - 기존 컴포넌트 수정 시 사용
 * - 저장 버튼 없음 (자동 저장)
 * - 디바운스로 변경사항 자동 저장
 * - View 무결성 검사
 */
export default function EditMode({ component, onSave, onCancel }: EditModeProps) {
    const [localComponent, setLocalComponent] = useState<ComponentData>(component);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isFirstRender = useRef(true);

    // View Store
    const isInView = useViewStore((state) => state.isInView);
    const removeFromViewByComponentId = useViewStore((state) => state.removeFromViewByComponentId);

    // 저장 로직
    const saveComponent = useCallback(
        async (comp: ComponentData) => {
            // create tier 검증 실패 시 저장하지 않음
            if (!canCreate(comp)) {
                return;
            }

            // View에 있는 컴포넌트인 경우 View 검증
            if (isInView(comp.id)) {
                if (!canAddToView(comp)) {
                    const missingFields = getMissingFieldLabels(comp, 'view');
                    toast({
                        variant: 'destructive',
                        title: 'Page에서 제거됨',
                        description: `필수 필드 누락: ${missingFields.join(', ')}`,
                    });
                    await removeFromViewByComponentId(comp.id);
                }
            }

            setSaveStatus('saving');
            try {
                await onSave(comp);
                setSaveStatus('saved');
                // 2초 후 상태 초기화
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('저장 실패:', error);
                setSaveStatus('idle');
                toast({
                    variant: 'destructive',
                    title: '저장 실패',
                    description: '컴포넌트를 저장하는 중 오류가 발생했습니다.',
                });
            }
        },
        [isInView, removeFromViewByComponentId, onSave]
    );

    // 디바운스된 저장 함수
    const debouncedSave = useDebounce(saveComponent, AUTO_SAVE_DELAY);

    // 로컬 상태 업데이트 및 자동 저장 트리거
    const updateLocal = (updates: Partial<ComponentData>) => {
        setLocalComponent((prev) => {
            const updated = { ...prev, ...updates } as ComponentData;
            // 디바운스된 저장 트리거
            debouncedSave(updated);
            return updated;
        });
    };

    // 컴포넌트가 변경되면 로컬 상태 업데이트 (다른 컴포넌트 선택 시)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setLocalComponent(component);
        setSaveStatus('idle');
    }, [component.id]); // id가 변경될 때만

    const getComponentIcon = () => {
        switch (localComponent.type) {
            case 'event':
                return <Calendar className="h-5 w-5" />;
            case 'mixset':
                return <Headphones className="h-5 w-5" />;
            case 'link':
                return <LinkIcon className="h-5 w-5" />;
        }
    };

    const getComponentTitle = () => {
        switch (localComponent.type) {
            case 'event':
                return '공연 편집';
            case 'mixset':
                return '믹스셋 편집';
            case 'link':
                return '링크 편집';
        }
    };

    // View 상태
    const isViewReady = canAddToView(localComponent);
    const componentIsInView = isInView(localComponent.id);
    const missingFields = !isViewReady ? getMissingFieldLabels(localComponent, 'view') : [];

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
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeStyles[localComponent.type]}`}
                    >
                        {getComponentIcon()}
                    </div>
                    <h2 className="text-xl font-semibold text-dashboard-text">
                        {getComponentTitle()}
                    </h2>

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
                                componentIsInView
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
                {isEventComponent(localComponent) && (
                    <ShowEditor component={localComponent} onUpdate={updateLocal} />
                )}
                {isMixsetComponent(localComponent) && (
                    <MixsetEditor component={localComponent} onUpdate={updateLocal} />
                )}
                {isLinkComponent(localComponent) && (
                    <LinkEditor component={localComponent} onUpdate={updateLocal} />
                )}
            </div>
        </div>
    );
}
