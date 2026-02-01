'use client';

import { useState } from 'react';
import { Calendar, Link, Music, Plus, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreateEventModal } from '@/components/event/CreateEventModal';
import type { DBEventWithVenue } from '@/types/database';

type ComponentType = 'event' | 'mixset' | 'link';
type EventAddMode = 'select' | 'new' | 'import';

interface AddComponentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddComponent: (type: 'show' | 'mixset' | 'link', eventData?: DBEventWithVenue) => void;
}

export function AddComponentModal({ open, onOpenChange, onAddComponent }: AddComponentModalProps) {
    const [step, setStep] = useState<'type' | 'event-mode' | 'import-list'>('type');
    const [events, setEvents] = useState<DBEventWithVenue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

    const resetAndClose = () => {
        setStep('type');
        onOpenChange(false);
    };

    const handleSelectType = async (type: ComponentType) => {
        if (type === 'event') {
            setStep('event-mode');
        } else {
            onAddComponent(type === 'mixset' ? 'mixset' : 'link');
            resetAndClose();
        }
    };

    const handleEventModeSelect = async (mode: EventAddMode) => {
        if (mode === 'new') {
            setIsCreateEventOpen(true);
        } else if (mode === 'import') {
            setIsLoading(true);
            try {
                const res = await fetch('/api/events');
                const json = await res.json();
                setEvents(json.data || []);
                setStep('import-list');
            } catch (err) {
                console.error('Failed to fetch events:', err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEventCreated = (event: DBEventWithVenue) => {
        setIsCreateEventOpen(false);
        onAddComponent('show', event);
        resetAndClose();
    };

    const handleImportEvent = (event: DBEventWithVenue) => {
        onAddComponent('show', event);
        resetAndClose();
    };

    const goBack = () => {
        if (step === 'import-list') {
            setStep('event-mode');
        } else if (step === 'event-mode') {
            setStep('type');
        }
    };

    return (
        <>
            <Dialog open={open && !isCreateEventOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    {step === 'type' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>컴포넌트 추가</DialogTitle>
                                <DialogDescription>
                                    페이지에 추가할 컴포넌트 유형을 선택하세요
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 grid gap-3">
                                <ComponentTypeButton
                                    icon={Calendar}
                                    label="이벤트 / 공연"
                                    description="공연 기록을 추가합니다"
                                    onClick={() => handleSelectType('event')}
                                    color="pink"
                                />
                                <ComponentTypeButton
                                    icon={Music}
                                    label="믹스셋"
                                    description="DJ 믹스나 녹음을 추가합니다"
                                    onClick={() => handleSelectType('mixset')}
                                    color="cyan"
                                />
                                <ComponentTypeButton
                                    icon={Link}
                                    label="링크"
                                    description="SNS나 외부 링크를 추가합니다"
                                    onClick={() => handleSelectType('link')}
                                    color="purple"
                                />
                            </div>
                        </>
                    )}

                    {step === 'event-mode' && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={goBack}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <DialogTitle>이벤트 추가</DialogTitle>
                                        <DialogDescription>
                                            이벤트를 어떻게 추가할까요?
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="mt-4 grid gap-3">
                                <ComponentTypeButton
                                    icon={Plus}
                                    label="새 이벤트 생성"
                                    description="새로운 공연 정보를 입력합니다"
                                    onClick={() => handleEventModeSelect('new')}
                                    color="green"
                                />
                                <ComponentTypeButton
                                    icon={Download}
                                    label="기존 이벤트 가져오기"
                                    description="이미 등록한 이벤트를 페이지에 추가합니다"
                                    onClick={() => handleEventModeSelect('import')}
                                    color="blue"
                                    disabled={isLoading}
                                />
                            </div>
                        </>
                    )}

                    {step === 'import-list' && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={goBack}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <DialogTitle>이벤트 선택</DialogTitle>
                                        <DialogDescription>
                                            페이지에 추가할 이벤트를 선택하세요
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="mt-4 max-h-[400px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : events.length > 0 ? (
                                    <div className="space-y-2">
                                        {events.map((event) => (
                                            <button
                                                key={event.id}
                                                onClick={() => handleImportEvent(event)}
                                                className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                                            >
                                                <div className="font-medium">
                                                    {event.title || formatDate(event.date)}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{event.venue?.name}</span>
                                                    <span>·</span>
                                                    <span>{formatDate(event.date)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                        <p>등록된 이벤트가 없습니다</p>
                                        <Button
                                            variant="link"
                                            className="mt-2"
                                            onClick={() => {
                                                setStep('event-mode');
                                                handleEventModeSelect('new');
                                            }}
                                        >
                                            새 이벤트 생성하기
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <CreateEventModal
                open={isCreateEventOpen}
                onOpenChange={setIsCreateEventOpen}
                onCreated={handleEventCreated}
            />
        </>
    );
}

function ComponentTypeButton({
    icon: Icon,
    label,
    description,
    onClick,
    color,
    disabled,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    onClick: () => void;
    color: 'pink' | 'cyan' | 'purple' | 'green' | 'blue';
    disabled?: boolean;
}) {
    const colorClasses = {
        pink: 'bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20',
        purple: 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20',
        green: 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20',
        blue: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="group flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${colorClasses[color]}`}
            >
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="font-medium">{label}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
            </div>
        </button>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
