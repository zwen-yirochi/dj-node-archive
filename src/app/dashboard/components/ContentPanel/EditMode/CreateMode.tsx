'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { canCreate } from '@/lib/validators';
import { type ComponentData, isEventComponent, isLinkComponent, isMixsetComponent } from '@/types';
import { Calendar, Headphones, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import LinkEditor from './LinkEditor';
import MixsetEditor from './MixsetEditor';
import ShowEditor from './ShowEditor';

interface CreateModeProps {
    component: ComponentData;
    onSave: (component: ComponentData) => Promise<void>;
    onCancel: () => void;
}

/**
 * 생성 모드 - 새 컴포넌트 생성 시 사용
 * - "추가" 버튼으로 수동 저장
 * - title만 필수 (canCreate 검증)
 */
export default function CreateMode({ component, onSave, onCancel }: CreateModeProps) {
    const [localComponent, setLocalComponent] = useState<ComponentData>(component);
    const [isSaving, setIsSaving] = useState(false);

    const updateLocal = (updates: Partial<ComponentData>) => {
        setLocalComponent((prev) => ({ ...prev, ...updates }) as ComponentData);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localComponent);
        } catch (error) {
            console.error('생성 실패:', error);
            toast({
                variant: 'destructive',
                title: '생성 실패',
                description: '컴포넌트를 생성하는 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSaving(false);
        }
    };

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
                return '새 공연 추가';
            case 'mixset':
                return '새 믹스셋 추가';
            case 'link':
                return '새 링크 추가';
        }
    };

    const isSaveEnabled = canCreate(localComponent);

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
                </div>
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

            {/* Footer - 추가 버튼 */}
            <div className="flex items-center justify-end gap-3 border-t border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
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
                    추가
                </Button>
            </div>
        </div>
    );
}
