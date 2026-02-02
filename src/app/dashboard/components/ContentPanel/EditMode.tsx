'use client';

import { Button } from '@/components/ui/button';
import {
    ComponentData,
    EventComponent,
    ICON_OPTIONS,
    LinkComponent,
    MixsetComponent,
} from '@/types';
import {
    Calendar,
    Globe,
    Headphones,
    Image as ImageIcon,
    Instagram,
    Link as LinkIcon,
    Loader2,
    Mail,
    Music,
    Plus,
    Trash2,
    X,
    Youtube,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface EditModeProps {
    component: ComponentData;
    isNew?: boolean;
    onSave: (component: ComponentData) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => void;
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

export default function EditMode({
    component,
    isNew = false,
    onSave,
    onCancel,
    onDelete,
}: EditModeProps) {
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
            console.error('저장 실패:', error);
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

    const isValid = () => {
        switch (localComponent.type) {
            case 'show': {
                const show = localComponent as EventComponent;
                return show.title.trim() !== '' && show.date !== '' && show.venue.trim() !== '';
            }
            case 'mixset': {
                const mixset = localComponent as MixsetComponent;
                return mixset.title.trim() !== '';
            }
            case 'link': {
                const link = localComponent as LinkComponent;
                return link.title.trim() !== '' && link.url.trim() !== '';
            }
            default:
                return false;
        }
    };

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            localComponent.type === 'show'
                                ? 'bg-pink-100 text-pink-600'
                                : localComponent.type === 'mixset'
                                  ? 'bg-cyan-100 text-cyan-600'
                                  : 'bg-purple-100 text-purple-600'
                        }`}
                    >
                        {getComponentIcon()}
                    </div>
                    <h2 className="text-xl font-semibold text-stone-900">{getComponentTitle()}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {localComponent.type === 'show' && (
                    <ShowEditor
                        component={localComponent as EventComponent}
                        onUpdate={updateLocal as (updates: Partial<EventComponent>) => void}
                    />
                )}
                {localComponent.type === 'mixset' && (
                    <MixsetEditor
                        component={localComponent as MixsetComponent}
                        onUpdate={updateLocal as (updates: Partial<MixsetComponent>) => void}
                    />
                )}
                {localComponent.type === 'link' && (
                    <LinkEditor
                        component={localComponent as LinkComponent}
                        onUpdate={updateLocal as (updates: Partial<LinkComponent>) => void}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-4">
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
                    <Button onClick={onCancel} variant="ghost">
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isValid() || isSaving}
                        className="bg-stone-900 text-white hover:bg-stone-800"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isNew ? '추가' : '저장'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Show Editor
function ShowEditor({
    component,
    onUpdate,
}: {
    component: EventComponent;
    onUpdate: (updates: Partial<EventComponent>) => void;
}) {
    const [tagInput, setTagInput] = useState('');

    const addTag = (username: string) => {
        const tag = username.startsWith('@') ? username : `@${username}`;
        if (!component.lineup.includes(tag)) {
            onUpdate({ lineup: [...component.lineup, tag] });
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        onUpdate({ lineup: component.lineup.filter((t) => t !== tag) });
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
        if (e.key === 'Backspace' && tagInput === '' && component.lineup.length > 0) {
            removeTag(component.lineup[component.lineup.length - 1]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Poster Image */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                    포스터 이미지
                </label>
                <div
                    className={`rounded-xl border-2 border-dashed p-4 ${component.posterUrl ? 'border-stone-300' : 'border-stone-200'}`}
                >
                    {component.posterUrl ? (
                        <div className="relative aspect-[3/4] max-w-[200px]">
                            <Image
                                src={component.posterUrl}
                                alt="포스터"
                                fill
                                className="rounded-lg object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ posterUrl: '' })}
                                className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-stone-400" />
                            <p className="text-sm text-stone-500">클릭하여 포스터 업로드</p>
                            <p className="mt-1 text-xs text-stone-400">권장: 3:4 비율</p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                                onChange={(e) => onUpdate({ posterUrl: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                    제목 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="쇼 / 페스티벌 이름"
                />
            </div>

            {/* Date & Venue */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                        날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={component.date}
                        onChange={(e) => onUpdate({ date: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                        장소 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={component.venue}
                        onChange={(e) => onUpdate({ venue: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                        placeholder="클럽, 베뉴 이름"
                    />
                </div>
            </div>

            {/* Lineup Tags */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">라인업</label>
                <div className="flex min-h-[48px] flex-wrap gap-2 rounded-lg border border-stone-300 bg-white p-2">
                    {component.lineup.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="text-stone-400 hover:text-stone-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="min-w-[120px] flex-1 border-none bg-transparent px-2 py-1 text-sm focus:outline-none"
                        placeholder={
                            component.lineup.length === 0 ? '@username으로 아티스트 태그' : ''
                        }
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">설명</label>
                <textarea
                    value={component.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full resize-none rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="쇼에 대한 설명을 입력하세요..."
                    rows={4}
                />
            </div>
        </div>
    );
}

// Mixset Editor
function MixsetEditor({
    component,
    onUpdate,
}: {
    component: MixsetComponent;
    onUpdate: (updates: Partial<MixsetComponent>) => void;
}) {
    const addTrack = () => {
        onUpdate({
            tracklist: [...component.tracklist, { track: '', artist: '', time: '0:00' }],
        });
    };

    const updateTrack = (index: number, field: 'track' | 'artist' | 'time', value: string) => {
        const newTracklist = [...component.tracklist];
        newTracklist[index] = { ...newTracklist[index], [field]: value };
        onUpdate({ tracklist: newTracklist });
    };

    const removeTrack = (index: number) => {
        onUpdate({
            tracklist: component.tracklist.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            {/* Cover Image */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">커버 이미지</label>
                <div
                    className={`rounded-xl border-2 border-dashed p-4 ${component.coverUrl ? 'border-stone-300' : 'border-stone-200'}`}
                >
                    {component.coverUrl ? (
                        <div className="relative mx-auto aspect-square max-w-[200px]">
                            <Image
                                src={component.coverUrl}
                                alt="커버"
                                fill
                                className="rounded-lg object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ coverUrl: '' })}
                                className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Music className="mx-auto mb-3 h-10 w-10 text-stone-400" />
                            <p className="text-sm text-stone-500">클릭하여 커버 업로드</p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                                onChange={(e) => onUpdate({ coverUrl: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Genre */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={component.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                        placeholder="믹스셋 제목"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">장르</label>
                    <input
                        type="text"
                        value={component.genre}
                        onChange={(e) => onUpdate({ genre: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                        placeholder="Techno, House, etc."
                    />
                </div>
            </div>

            {/* Release Date */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">발매일</label>
                <input
                    type="date"
                    value={component.releaseDate}
                    onChange={(e) => onUpdate({ releaseDate: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
            </div>

            {/* SoundCloud Embed */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                    SoundCloud 임베드 URL
                </label>
                <input
                    type="text"
                    value={component.soundcloudEmbedUrl || ''}
                    onChange={(e) => onUpdate({ soundcloudEmbedUrl: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="https://w.soundcloud.com/player/?url=..."
                />
            </div>

            {/* Tracklist */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">트랙리스트</label>
                <div className="space-y-2">
                    {component.tracklist.map((track, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={track.time}
                                onChange={(e) => updateTrack(index, 'time', e.target.value)}
                                placeholder="0:00"
                                className="w-16 rounded-lg border border-stone-300 bg-white px-2 py-2 text-center text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                            />
                            <input
                                type="text"
                                value={track.track}
                                onChange={(e) => updateTrack(index, 'track', e.target.value)}
                                placeholder="트랙 제목"
                                className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                            />
                            <input
                                type="text"
                                value={track.artist}
                                onChange={(e) => updateTrack(index, 'artist', e.target.value)}
                                placeholder="아티스트"
                                className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                            />
                            <button
                                onClick={() => removeTrack(index)}
                                className="p-2 text-stone-400 transition-colors hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addTrack}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 p-3 text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-600"
                    >
                        <Plus className="h-4 w-4" />
                        트랙 추가
                    </button>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">설명</label>
                <textarea
                    value={component.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full resize-none rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="믹스셋에 대한 설명..."
                    rows={3}
                />
            </div>
        </div>
    );
}

// Link Editor
function LinkEditor({
    component,
    onUpdate,
}: {
    component: LinkComponent;
    onUpdate: (updates: Partial<LinkComponent>) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Icon Selector */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">아이콘</label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {ICON_OPTIONS.map((icon) => {
                        const IconComponent = iconComponents[icon] || Globe;
                        return (
                            <button
                                key={icon}
                                onClick={() => onUpdate({ icon })}
                                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors ${
                                    component.icon === icon
                                        ? 'border-stone-900 bg-stone-100'
                                        : 'border-stone-200 hover:border-stone-300'
                                }`}
                                title={icon}
                            >
                                <IconComponent className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                    제목 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="SoundCloud, Instagram, etc."
                />
            </div>

            {/* URL */}
            <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                    URL <span className="text-red-500">*</span>
                </label>
                <input
                    type="url"
                    value={component.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}
