'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { canAddToView, canCreate, getMissingFieldLabels } from '@/lib/validators';
import { useViewStore } from '@/stores/viewStore';
import { type ComponentData, isEventComponent, isLinkComponent, isMixsetComponent } from '@/types';
import { Calendar, Headphones, Link as LinkIcon, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import LinkEditor from './LinkEditor';
import MixsetEditor from './MixsetEditor';
import ShowEditor from './ShowEditor';

interface EditModeProps {
    component: ComponentData;
    isNew?: boolean;
    onSave: (component: ComponentData) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => void;
}

export default function EditMode({
    component,
    isNew = false,
    onSave,
    onCancel,
    onDelete,
}: EditModeProps) {
    const [localComponent, setLocalComponent] = useState<ComponentData>(component);
    const [isSaving, setIsSaving] = useState(false);

    // View Store
    const isInView = useViewStore((state) => state.isInView);
    const removeFromViewByComponentId = useViewStore((state) => state.removeFromViewByComponentId);

    const updateLocal = (updates: Partial<ComponentData>) => {
        setLocalComponent((prev) => ({ ...prev, ...updates }) as ComponentData);
    };

    const handleSave = async () => {
        // View에 있는 컴포넌트인 경우 View 검증
        if (isInView(localComponent.id)) {
            if (!canAddToView(localComponent)) {
                const missingFields = getMissingFieldLabels(localComponent, 'view');
                toast({
                    variant: 'destructive',
                    title: 'Page에서 제거됨',
                    description: `필수 필드 누락: ${missingFields.join(', ')}`,
                });
                // View에서 제거
                await removeFromViewByComponentId(localComponent.id);
            }
        }

        setIsSaving(true);
        try {
            await onSave(localComponent);
        } catch (error) {
            console.error('저장 실패:', error);
            toast({
                variant: 'destructive',
                title: '저장 실패',
                description: '컴포넌트를 저장하는 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getComponentIcon = () => {
        switch (localComponent.type) {
            case 'show':
                return <Calendar className="h-5 w-5" />;
            case 'mixset':
                return <Headphones className="h-5 w-5" />;
            case 'link':
                return <LinkIcon className="h-5 w-5" />;
        }
    };

    const getComponentTitle = () => {
        switch (localComponent.type) {
            case 'show':
                return isNew ? '새 공연 추가' : '공연 편집';
            case 'mixset':
                return isNew ? '새 믹스셋 추가' : '믹스셋 편집';
            case 'link':
                return isNew ? '새 링크 추가' : '링크 편집';
        }
    };

    // 저장 가능 여부: create tier 검증 (title만 필수)
    const isSaveEnabled = canCreate(localComponent);

    // View 추가 가능 여부 표시용
    const isViewReady = canAddToView(localComponent);
    const componentIsInView = isInView(localComponent.id);

    const typeStyles = {
        show: 'bg-blue-50 text-dashboard-type-event',
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
                </div>

                {/* View 상태 표시 */}
                {!isNew && (
                    <div className="flex items-center gap-2">
                        {componentIsInView && !isViewReady && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                저장 시 Page에서 제거됨
                            </span>
                        )}
                        {!componentIsInView && !isViewReady && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                                Page 추가 불가
                            </span>
                        )}
                    </div>
                )}
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

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div>
                    {!isNew && onDelete && (
                        <Button
                            onClick={onDelete}
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isSaveEnabled || isSaving}
                        className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isNew ? '추가' : '저장'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
