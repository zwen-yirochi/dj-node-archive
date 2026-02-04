'use client';

import { Button } from '@/components/ui/button';
import {
    EditableDateField,
    EditableField,
    EditableTagsField,
} from '@/components/ui/editable-field';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import { cn } from '@/lib/utils';
import {
    type ComponentData,
    type EventComponent,
    isEventComponent,
    isLinkComponent,
    isMixsetComponent,
    type LinkComponent,
    type MixsetComponent,
    ICON_OPTIONS,
} from '@/types';
import {
    Calendar,
    ExternalLink,
    Globe,
    Headphones,
    Instagram,
    Link as LinkIcon,
    Mail,
    MapPin,
    MoreHorizontal,
    Music,
    Plus,
    Trash2,
    Users,
    X,
    Youtube,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';

interface InlineEditModeProps {
    component: ComponentData;
    onSave: (component: ComponentData) => Promise<void>;
    onDelete: () => void;
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
};

// 디바운스된 저장을 위한 훅
function useDebouncedSave(
    onSave: (component: ComponentData) => Promise<void>,
    delay: number = 800
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const debouncedSave = useCallback(
        (component: ComponentData) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
                setIsSaving(true);
                try {
                    await onSave(component);
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('저장 실패:', error);
                } finally {
                    setIsSaving(false);
                }
            }, delay);
        },
        [onSave, delay]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { debouncedSave, isSaving, lastSaved };
}

export default function InlineEditMode({ component, onSave, onDelete }: InlineEditModeProps) {
    const [localComponent, setLocalComponent] = useState<ComponentData>(component);
    const { debouncedSave, isSaving, lastSaved } = useDebouncedSave(onSave);

    // 외부 컴포넌트가 변경되면 로컬 상태 업데이트
    useEffect(() => {
        setLocalComponent(component);
    }, [component]);

    const updateField = <K extends keyof ComponentData>(key: K, value: ComponentData[K]) => {
        const updated = { ...localComponent, [key]: value } as ComponentData;
        setLocalComponent(updated);
        debouncedSave(updated);
    };

    const getTypeColor = () => {
        switch (localComponent.type) {
            case 'event':
                return 'bg-blue-50 text-dashboard-type-event border-blue-200';
            case 'mixset':
                return 'bg-purple-50 text-dashboard-type-mixset border-purple-200';
            case 'link':
                return 'bg-green-50 text-dashboard-type-link border-green-200';
        }
    };

    const getTypeIcon = () => {
        switch (localComponent.type) {
            case 'event':
                return <Calendar className="h-4 w-4" />;
            case 'mixset':
                return <Headphones className="h-4 w-4" />;
            case 'link':
                return <LinkIcon className="h-4 w-4" />;
        }
    };

    // 저장 상태 표시 텍스트
    const getSaveStatus = () => {
        if (isSaving) return '저장 중...';
        if (lastSaved) {
            const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
            if (seconds < 5) return '저장됨';
        }
        return null;
    };

    const saveStatus = getSaveStatus();

    // 더보기 메뉴 아이템
    const menuItems: DropdownMenuItemConfig[] = [
        { label: '삭제', onClick: onDelete, icon: Trash2, variant: 'danger' },
    ];

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
                <div className="flex items-center gap-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()}`}
                    >
                        {getTypeIcon()}
                        {localComponent.type}
                    </span>
                    {saveStatus && (
                        <span className="text-xs text-dashboard-text-muted">{saveStatus}</span>
                    )}
                </div>
                <SimpleDropdown
                    trigger={
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    }
                    items={menuItems}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <p className="mb-4 text-xs text-dashboard-text-placeholder">
                    더블클릭하여 편집 · Enter로 저장 · Escape로 취소
                </p>
                {isEventComponent(localComponent) && (
                    <ShowInlineEdit
                        component={localComponent}
                        onUpdate={(updates) => {
                            const updated = { ...localComponent, ...updates } as EventComponent;
                            setLocalComponent(updated);
                            debouncedSave(updated);
                        }}
                    />
                )}
                {isMixsetComponent(localComponent) && (
                    <MixsetInlineEdit
                        component={localComponent}
                        onUpdate={(updates) => {
                            const updated = { ...localComponent, ...updates } as MixsetComponent;
                            setLocalComponent(updated);
                            debouncedSave(updated);
                        }}
                    />
                )}
                {isLinkComponent(localComponent) && (
                    <LinkInlineEdit
                        component={localComponent}
                        onUpdate={(updates) => {
                            const updated = { ...localComponent, ...updates } as LinkComponent;
                            setLocalComponent(updated);
                            debouncedSave(updated);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// ===== Show 인라인 편집 =====
function ShowInlineEdit({
    component,
    onUpdate,
}: {
    component: EventComponent;
    onUpdate: (updates: Partial<EventComponent>) => void;
}) {
    return (
        <div className="space-y-4">
            {/* Poster */}
            <ImageEditor
                value={component.posterUrl}
                onSave={(url) => onUpdate({ posterUrl: url })}
                aspectRatio="3/4"
                placeholder="포스터 이미지"
            />

            {/* Title */}
            <EditableField
                value={component.title}
                onSave={(value) => onUpdate({ title: value })}
                placeholder="제목 없음"
                required
                className="text-center text-xl font-bold text-dashboard-text"
            />

            {/* Info Grid */}
            <div className="space-y-3 rounded-xl bg-dashboard-bg-muted p-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditableDateField
                        value={component.date}
                        onSave={(value) => onUpdate({ date: value })}
                        required
                        className="text-dashboard-text-secondary"
                    />
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditableField
                        value={component.venue}
                        onSave={(value) => onUpdate({ venue: value })}
                        placeholder="장소를 입력하세요"
                        required
                        className="flex-1 text-dashboard-text-secondary"
                    />
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                    <EditableTagsField
                        value={component.lineup}
                        onSave={(value) => onUpdate({ lineup: value })}
                        placeholder="@username으로 아티스트 태그"
                        className="flex-1"
                    />
                </div>
            </div>

            {/* Description */}
            <EditableField
                value={component.description}
                onSave={(value) => onUpdate({ description: value })}
                placeholder="쇼에 대한 설명을 입력하세요..."
                multiline
                rows={4}
                className="text-sm leading-relaxed text-dashboard-text-muted"
            />

            {/* Links */}
            <LinksEditor links={component.links || []} onSave={(links) => onUpdate({ links })} />
        </div>
    );
}

// ===== Mixset 인라인 편집 =====
function MixsetInlineEdit({
    component,
    onUpdate,
}: {
    component: MixsetComponent;
    onUpdate: (updates: Partial<MixsetComponent>) => void;
}) {
    return (
        <div className="space-y-4">
            {/* Cover */}
            <ImageEditor
                value={component.coverUrl}
                onSave={(url) => onUpdate({ coverUrl: url })}
                aspectRatio="1/1"
                placeholder="커버 이미지"
            />

            {/* Title */}
            <EditableField
                value={component.title}
                onSave={(value) => onUpdate({ title: value })}
                placeholder="제목 없음"
                required
                className="text-center text-xl font-bold text-dashboard-text"
            />

            {/* Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-dashboard-text-muted">
                <EditableField
                    value={component.genre}
                    onSave={(value) => onUpdate({ genre: value })}
                    placeholder="장르"
                    className="text-center"
                />
                {component.releaseDate && (
                    <span className="h-1 w-1 rounded-full bg-dashboard-border-hover" />
                )}
                <EditableDateField
                    value={component.releaseDate}
                    onSave={(value) => onUpdate({ releaseDate: value })}
                    className="text-center"
                />
            </div>

            {/* SoundCloud Embed URL */}
            <div className="rounded-xl bg-dashboard-bg-muted p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    SoundCloud 임베드
                </p>
                <EditableField
                    value={component.soundcloudEmbedUrl || ''}
                    onSave={(value) => onUpdate({ soundcloudEmbedUrl: value })}
                    placeholder="https://w.soundcloud.com/player/?url=..."
                    className="text-sm text-dashboard-text-secondary"
                />
            </div>

            {/* Description */}
            <EditableField
                value={component.description}
                onSave={(value) => onUpdate({ description: value })}
                placeholder="믹스셋에 대한 설명..."
                multiline
                rows={3}
                className="text-sm leading-relaxed text-dashboard-text-muted"
            />

            {/* Tracklist */}
            <TracklistEditor
                tracklist={component.tracklist}
                onSave={(tracklist) => onUpdate({ tracklist })}
            />
        </div>
    );
}

// ===== Link 인라인 편집 =====
function LinkInlineEdit({
    component,
    onUpdate,
}: {
    component: LinkComponent;
    onUpdate: (updates: Partial<LinkComponent>) => void;
}) {
    const [showIconSelector, setShowIconSelector] = useState(false);
    const IconComponent = iconComponents[component.icon] || Globe;

    return (
        <div className="space-y-4 py-4 text-center">
            {/* Icon */}
            <div className="relative mx-auto">
                <button
                    onClick={() => setShowIconSelector(!showIconSelector)}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted transition-colors hover:bg-dashboard-bg-hover"
                    title="클릭하여 아이콘 변경"
                >
                    <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
                </button>
                {showIconSelector && (
                    <div className="absolute left-1/2 z-10 mt-2 -translate-x-1/2 rounded-xl border border-dashboard-border bg-dashboard-bg-card p-3 shadow-lg">
                        <div className="grid grid-cols-4 gap-2">
                            {ICON_OPTIONS.map((icon) => {
                                const Icon = iconComponents[icon] || Globe;
                                return (
                                    <button
                                        key={icon}
                                        onClick={() => {
                                            onUpdate({ icon });
                                            setShowIconSelector(false);
                                        }}
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
                                            component.icon === icon
                                                ? 'border-dashboard-text bg-dashboard-bg-muted'
                                                : 'border-transparent hover:bg-dashboard-bg-hover'
                                        )}
                                        title={icon}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Title */}
            <EditableField
                value={component.title}
                onSave={(value) => onUpdate({ title: value })}
                placeholder="제목 없음"
                required
                className="text-xl font-bold text-dashboard-text"
            />

            {/* URL */}
            <div className="inline-flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-dashboard-text-muted" />
                <EditableField
                    value={component.url}
                    onSave={(value) => onUpdate({ url: value })}
                    placeholder="https://..."
                    required
                    className="text-sm text-dashboard-text-muted"
                />
            </div>
        </div>
    );
}

// ===== 이미지 에디터 =====
function ImageEditor({
    value,
    onSave,
    aspectRatio,
    placeholder,
}: {
    value: string;
    onSave: (url: string) => void;
    aspectRatio: '3/4' | '1/1';
    placeholder: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    if (value) {
        return (
            <div
                className={cn(
                    'relative mx-auto overflow-hidden rounded-xl',
                    aspectRatio === '3/4'
                        ? 'aspect-[3/4] max-w-[200px]'
                        : 'aspect-square max-w-[200px]'
                )}
            >
                <Image src={value} alt={placeholder} fill className="object-cover" />
                <button
                    onClick={() => onSave('')}
                    className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            className={cn(
                'mx-auto rounded-xl border-2 border-dashed border-dashboard-border p-4 text-center',
                aspectRatio === '3/4' ? 'aspect-[3/4] max-w-[200px]' : 'aspect-square max-w-[200px]'
            )}
        >
            <div className="flex h-full flex-col items-center justify-center">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => {
                            if (inputValue.trim()) {
                                onSave(inputValue.trim());
                            }
                            setIsEditing(false);
                            setInputValue('');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && inputValue.trim()) {
                                onSave(inputValue.trim());
                                setIsEditing(false);
                                setInputValue('');
                            } else if (e.key === 'Escape') {
                                setIsEditing(false);
                                setInputValue('');
                            }
                        }}
                        placeholder="이미지 URL 입력"
                        className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-3 py-2 text-center text-sm focus:border-dashboard-text focus:outline-none"
                    />
                ) : (
                    <>
                        <Music className="mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                        <p className="text-xs text-dashboard-text-muted">더블클릭하여 URL 입력</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ===== Links 에디터 =====
function LinksEditor({
    links,
    onSave,
}: {
    links: { title: string; url: string }[];
    onSave: (links: { title: string; url: string }[]) => void;
}) {
    const addLink = () => {
        onSave([...links, { title: '', url: '' }]);
    };

    const updateLink = (index: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        onSave(newLinks);
    };

    const removeLink = (index: number) => {
        onSave(links.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                관련 링크
            </p>
            {links.map((link, i) => (
                <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-dashboard-bg-muted px-3 py-2"
                >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                    <EditableField
                        value={link.title}
                        onSave={(value) => updateLink(i, 'title', value)}
                        placeholder="링크 제목"
                        className="flex-1 text-sm text-dashboard-text-secondary"
                    />
                    <EditableField
                        value={link.url}
                        onSave={(value) => updateLink(i, 'url', value)}
                        placeholder="URL"
                        className="flex-1 text-sm text-dashboard-text-muted"
                    />
                    <button
                        onClick={() => removeLink(i)}
                        className="p-1 text-dashboard-text-placeholder hover:text-red-500"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={addLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
            >
                <Plus className="h-3.5 w-3.5" />
                링크 추가
            </button>
        </div>
    );
}

// ===== Tracklist 에디터 =====
function TracklistEditor({
    tracklist,
    onSave,
}: {
    tracklist: { track: string; artist: string; time: string }[];
    onSave: (tracklist: { track: string; artist: string; time: string }[]) => void;
}) {
    const addTrack = () => {
        onSave([...tracklist, { track: '', artist: '', time: '0:00' }]);
    };

    const updateTrack = (index: number, field: 'track' | 'artist' | 'time', value: string) => {
        const newTracklist = [...tracklist];
        newTracklist[index] = { ...newTracklist[index], [field]: value };
        onSave(newTracklist);
    };

    const removeTrack = (index: number) => {
        onSave(tracklist.filter((_, i) => i !== index));
    };

    return (
        <div className="rounded-xl bg-dashboard-bg-muted p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                Tracklist
            </h3>
            <div className="space-y-2">
                {tracklist.map((track, i) => (
                    <div key={i} className="flex items-baseline gap-3 text-sm">
                        <EditableField
                            value={track.time}
                            onSave={(value) => updateTrack(i, 'time', value)}
                            placeholder="0:00"
                            className="w-12 shrink-0 font-mono text-xs text-dashboard-text-placeholder"
                        />
                        <div className="min-w-0 flex-1">
                            <EditableField
                                value={track.track}
                                onSave={(value) => updateTrack(i, 'track', value)}
                                placeholder="트랙 제목"
                                className="text-dashboard-text-secondary"
                            />
                        </div>
                        <EditableField
                            value={track.artist}
                            onSave={(value) => updateTrack(i, 'artist', value)}
                            placeholder="아티스트"
                            className="text-dashboard-text-placeholder"
                        />
                        <button
                            onClick={() => removeTrack(i)}
                            className="p-1 text-dashboard-text-placeholder hover:text-red-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addTrack}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dashboard-border-hover p-2 text-sm text-dashboard-text-muted transition-colors hover:border-dashboard-text hover:text-dashboard-text-secondary"
                >
                    <Plus className="h-3.5 w-3.5" />
                    트랙 추가
                </button>
            </div>
        </div>
    );
}
