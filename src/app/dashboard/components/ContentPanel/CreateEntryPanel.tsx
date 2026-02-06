'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { type EntryType, useUIStore } from '@/stores/uiStore';
import { Calendar, Headphones, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CreateEntryPanelProps {
    type: EntryType;
}

const typeConfig = {
    event: {
        icon: Calendar,
        title: '새 공연 추가',
        titlePlaceholder: '공연 제목을 입력하세요',
        bgColor: 'bg-blue-50',
        textColor: 'text-dashboard-type-event',
        entityName: '공연',
    },
    mixset: {
        icon: Headphones,
        title: '새 믹스셋 추가',
        titlePlaceholder: '믹스셋 제목을 입력하세요',
        bgColor: 'bg-purple-50',
        textColor: 'text-dashboard-type-mixset',
        entityName: '믹스셋',
    },
    link: {
        icon: LinkIcon,
        title: '새 링크 추가',
        titlePlaceholder: '링크 제목을 입력하세요',
        bgColor: 'bg-green-50',
        textColor: 'text-dashboard-type-link',
        entityName: '링크',
    },
};

export default function CreateEntryPanel({ type }: CreateEntryPanelProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Stores
    const createEntry = useContentEntryStore((state) => state.createEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);
    const closeCreatePanel = useUIStore((state) => state.closeCreatePanel);
    const selectEntry = useUIStore((state) => state.selectEntry);
    const startCreating = useUIStore((state) => state.startCreating);

    const config = typeConfig[type];
    const Icon = config.icon;

    const handleCreate = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: '제목 필요',
                description: '제목을 입력해주세요.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const newEntry = createEmptyEntry(type);
            newEntry.title = title.trim();

            await createEntry(newEntry);
            finishCreatingEntry(newEntry.id);
            triggerPreviewRefresh();
            closeCreatePanel();
            selectEntry(newEntry.id);

            toast({
                title: '생성 완료',
                description: `${config.entityName}이(가) 생성되었습니다.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: '생성 실패',
                description: '컴포넌트를 생성하는 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAndEdit = async () => {
        setIsSaving(true);
        try {
            const newEntry = createEmptyEntry(type);
            if (title.trim()) {
                newEntry.title = title.trim();
            }

            await createEntry(newEntry);
            closeCreatePanel();
            startCreating(newEntry.id);
        } catch {
            toast({
                variant: 'destructive',
                title: '생성 실패',
                description: '컴포넌트를 생성하는 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        closeCreatePanel();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="flex h-full flex-col bg-dashboard-bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor} ${config.textColor}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-dashboard-text">{config.title}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-dashboard-text-secondary">
                            제목
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.titlePlaceholder}
                            autoFocus
                            className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-dashboard-border bg-dashboard-bg-muted px-6 py-4">
                <Button
                    onClick={handleCreateAndEdit}
                    variant="ghost"
                    disabled={isSaving}
                    className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                >
                    상세 편집으로 생성
                </Button>
                <div className="flex gap-3">
                    <Button
                        onClick={handleCancel}
                        variant="ghost"
                        className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!title.trim() || isSaving}
                        className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        추가
                    </Button>
                </div>
            </div>
        </div>
    );
}
