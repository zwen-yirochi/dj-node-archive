'use client';

import { CreateEventModal } from '@/components/event/CreateEventModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DBEventWithVenue } from '@/types/database';
import { Calendar, Link, Loader2, Music, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

type EntryType = 'event' | 'mixset' | 'link';

interface AddComponentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddComponent: (type: 'event' | 'mixset' | 'link', eventData?: DBEventWithVenue) => void;
}

const componentTypes = [
    {
        id: 'event' as EntryType,
        icon: Calendar,
        label: '이벤트 / 공연',
        description: '공연 기록을 추가합니다',
        color: 'pink',
    },
    {
        id: 'mixset' as EntryType,
        icon: Music,
        label: '믹스셋',
        description: 'DJ 믹스나 녹음을 추가합니다',
        color: 'cyan',
    },
    {
        id: 'link' as EntryType,
        icon: Link,
        label: '링크',
        description: 'SNS나 외부 링크를 추가합니다',
        color: 'purple',
    },
];

export function AddComponentModal({ open, onOpenChange, onAddComponent }: AddComponentModalProps) {
    const [selectedType, setSelectedType] = useState<EntryType>('event');
    const [searchQuery, setSearchQuery] = useState('');
    const [events, setEvents] = useState<DBEventWithVenue[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<DBEventWithVenue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

    // 이벤트 타입 선택 시 이벤트 목록 로드
    useEffect(() => {
        if (open && selectedType === 'event') {
            fetchEvents();
        }
    }, [open, selectedType]);

    // 검색 필터링
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEvents(events);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredEvents(
                events.filter(
                    (event) =>
                        event.title?.toLowerCase().includes(query) ||
                        event.venue?.name?.toLowerCase().includes(query) ||
                        formatDate(event.date).includes(query)
                )
            );
        }
    }, [searchQuery, events]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/events');
            const json = await res.json();
            setEvents(json.data || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetAndClose = () => {
        setSelectedType('event');
        setSearchQuery('');
        onOpenChange(false);
    };

    const handleSelectType = (type: EntryType) => {
        setSelectedType(type);
        if (type !== 'event') {
            onAddComponent(type === 'mixset' ? 'mixset' : 'link');
            resetAndClose();
        }
    };

    const handleEventCreated = (event: DBEventWithVenue) => {
        setIsCreateEventOpen(false);
        onAddComponent('event', event);
        resetAndClose();
    };

    const handleImportEvent = (event: DBEventWithVenue) => {
        onAddComponent('event', event);
        resetAndClose();
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { base: string; selected: string }> = {
            pink: {
                base: 'hover:bg-pink-500/10 hover:border-pink-500/30',
                selected: 'bg-pink-500/15 border-pink-500/40 text-pink-500',
            },
            cyan: {
                base: 'hover:bg-cyan-500/10 hover:border-cyan-500/30',
                selected: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-500',
            },
            purple: {
                base: 'hover:bg-purple-500/10 hover:border-purple-500/30',
                selected: 'bg-purple-500/15 border-purple-500/40 text-purple-500',
            },
        };
        return isSelected ? colors[color].selected : colors[color].base;
    };

    const showNoResults =
        selectedType === 'event' && searchQuery.trim() && filteredEvents.length === 0;

    return (
        <>
            <Dialog open={open && !isCreateEventOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl p-0">
                    <div className="flex min-h-[500px]">
                        {/* 사이드바 - 컴포넌트 유형 선택 */}
                        <div className="w-56 shrink-0 border-r bg-muted/30 p-4">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-lg">컴포넌트 추가</DialogTitle>
                            </DialogHeader>

                            <nav className="space-y-1">
                                {componentTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = selectedType === type.id;

                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => handleSelectType(type.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors',
                                                getColorClasses(type.color, isSelected)
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* 메인 콘텐츠 */}
                        <div className="flex flex-1 flex-col p-6">
                            {selectedType === 'event' && (
                                <>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">이벤트 검색</h3>
                                        <p className="text-sm text-muted-foreground">
                                            기존 이벤트를 검색하거나 새로 생성하세요
                                        </p>
                                    </div>

                                    {/* 검색바 */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="이벤트명, 장소로 검색..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>

                                    {/* 이벤트 목록 */}
                                    <div className="flex-1 overflow-y-auto">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : showNoResults ? (
                                            <div className="py-12 text-center">
                                                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                                                <p className="text-muted-foreground">
                                                    &quot;{searchQuery}&quot;에 대한 검색 결과가
                                                    없습니다
                                                </p>
                                                <Button
                                                    variant="link"
                                                    className="mt-2"
                                                    onClick={() => setIsCreateEventOpen(true)}
                                                >
                                                    <Plus className="mr-1 h-4 w-4" />새 이벤트
                                                    생성하기
                                                </Button>
                                            </div>
                                        ) : filteredEvents.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredEvents.map((event) => (
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
                                            <div className="py-12 text-center">
                                                <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                                                <p className="text-muted-foreground">
                                                    등록된 이벤트가 없습니다
                                                </p>
                                                <Button
                                                    variant="link"
                                                    className="mt-2"
                                                    onClick={() => setIsCreateEventOpen(true)}
                                                >
                                                    <Plus className="mr-1 h-4 w-4" />첫 이벤트
                                                    생성하기
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 하단 - 새 이벤트 생성 버튼 */}
                                    {filteredEvents.length > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => setIsCreateEventOpen(true)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />새 이벤트 생성
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedType === 'mixset' && (
                                <div className="flex flex-1 items-center justify-center">
                                    <div className="text-center">
                                        <Music className="mx-auto mb-3 h-12 w-12 text-cyan-500/50" />
                                        <p className="text-muted-foreground">
                                            믹스셋 컴포넌트가 추가됩니다
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'link' && (
                                <div className="flex flex-1 items-center justify-center">
                                    <div className="text-center">
                                        <Link className="mx-auto mb-3 h-12 w-12 text-purple-500/50" />
                                        <p className="text-muted-foreground">
                                            링크 컴포넌트가 추가됩니다
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
