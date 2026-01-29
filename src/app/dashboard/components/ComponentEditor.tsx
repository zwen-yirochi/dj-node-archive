'use client';

import {
    ArtistSuggestion,
    ComponentData,
    EventComponent,
    ICON_OPTIONS,
    LinkComponent,
    MixsetComponent,
} from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    Globe,
    Headphones,
    Image as ImageIcon,
    Instagram,
    Link as LinkIcon,
    Mail,
    Music,
    Plus,
    Trash2,
    X,
    Youtube,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface ComponentEditorProps {
    component: ComponentData;
    onUpdate: (updates: Partial<ComponentData>) => void;
    onClose: () => void;
    onDelete: () => void;
}

// Mock artist suggestions
const mockArtistSuggestions: ArtistSuggestion[] = [
    {
        username: 'nightshift',
        displayName: 'NIGHTSHIFT',
        avatarUrl:
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    },
    {
        username: 'pulse_kr',
        displayName: 'PULSE_KR',
        avatarUrl:
            'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    },
    {
        username: 'echo_seoul',
        displayName: 'ECHO SEOUL',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
    {
        username: 'minimal_kim',
        displayName: 'Minimal Kim',
        avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
];

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

export default function ComponentEditor({
    component,
    onUpdate,
    onClose,
    onDelete,
}: ComponentEditorProps) {
    const getComponentIcon = () => {
        switch (component.type) {
            case 'show':
                return <Calendar className="h-5 w-5" />;
            case 'mixset':
                return <Headphones className="h-5 w-5" />;
            case 'link':
                return <LinkIcon className="h-5 w-5" />;
        }
    };

    const getComponentTitle = () => {
        switch (component.type) {
            case 'show':
                return '쇼 / 공연 편집';
            case 'mixset':
                return '믹스셋 편집';
            case 'link':
                return '링크 편집';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="bg-void/80 absolute inset-0 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-surface relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 p-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                component.type === 'show'
                                    ? 'bg-neon-pink/15 text-neon-pink'
                                    : component.type === 'mixset'
                                      ? 'bg-neon-cyan/15 text-neon-cyan'
                                      : 'bg-neon-purple/15 text-neon-purple'
                            }`}
                        >
                            {getComponentIcon()}
                        </div>
                        <h2 className="font-display text-warm-white text-xl tracking-wide">
                            {getComponentTitle()}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:text-warm-white rounded-lg p-2 text-muted transition-colors hover:bg-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
                    {component.type === 'show' && (
                        <ShowEditor
                            component={component as EventComponent}
                            onUpdate={onUpdate as (updates: Partial<EventComponent>) => void}
                        />
                    )}
                    {component.type === 'mixset' && (
                        <MixsetEditor
                            component={component as MixsetComponent}
                            onUpdate={onUpdate as (updates: Partial<MixsetComponent>) => void}
                        />
                    )}
                    {component.type === 'link' && (
                        <LinkEditor
                            component={component as LinkComponent}
                            onUpdate={onUpdate as (updates: Partial<LinkComponent>) => void}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/5 p-4">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        삭제
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-neon-pink hover:bg-neon-pink/90 rounded-lg px-6 py-2 font-medium text-white transition-colors"
                    >
                        완료
                    </button>
                </div>
            </motion.div>
        </motion.div>
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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<ArtistSuggestion[]>([]);
    const tagInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (tagInput.startsWith('@') && tagInput.length > 1) {
            const query = tagInput.slice(1).toLowerCase();
            const filtered = mockArtistSuggestions.filter(
                (a) =>
                    a.username.toLowerCase().includes(query) ||
                    a.displayName.toLowerCase().includes(query)
            );
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [tagInput]);

    const addTag = (username: string) => {
        const tag = `@${username}`;
        if (!component.lineup.includes(tag)) {
            onUpdate({ lineup: [...component.lineup, tag] });
        }
        setTagInput('');
        setShowSuggestions(false);
    };

    const removeTag = (tag: string) => {
        onUpdate({ lineup: component.lineup.filter((t) => t !== tag) });
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.startsWith('@') && tagInput.length > 1) {
            e.preventDefault();
            addTag(tagInput.slice(1));
        }
        if (e.key === 'Backspace' && tagInput === '' && component.lineup.length > 0) {
            removeTag(component.lineup[component.lineup.length - 1]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Poster Image */}
            <div>
                <label className="editor-label">포스터 이미지</label>
                <div className={`image-upload-area ${component.posterUrl ? 'has-image' : ''}`}>
                    {component.posterUrl ? (
                        <div className="relative aspect-[3/4]">
                            <Image
                                src={component.posterUrl}
                                alt="포스터"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ posterUrl: '' })}
                                className="bg-void/80 absolute right-2 top-2 rounded-lg p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted" />
                            <p className="text-sm text-muted">클릭하여 포스터 업로드</p>
                            <p className="mt-1 text-xs text-muted/60">권장: 3:4 비율</p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="editor-input mt-4 text-center"
                                onChange={(e) => onUpdate({ posterUrl: e.target.value })}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="editor-label">제목</label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="editor-input"
                    placeholder="쇼 / 페스티벌 이름"
                />
            </div>

            {/* Date & Venue */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="editor-label">날짜</label>
                    <input
                        type="date"
                        value={component.date}
                        onChange={(e) => onUpdate({ date: e.target.value })}
                        className="editor-input"
                    />
                </div>
                <div>
                    <label className="editor-label">장소</label>
                    <input
                        type="text"
                        value={component.venue}
                        onChange={(e) => onUpdate({ venue: e.target.value })}
                        className="editor-input"
                        placeholder="클럽, 베뉴 이름"
                    />
                </div>
            </div>

            {/* Lineup Tags */}
            <div>
                <label className="editor-label">라인업</label>
                <div className="relative">
                    <div className="tag-input-container">
                        {component.lineup.map((tag) => (
                            <span key={tag} className="tag-chip">
                                {tag}
                                <button onClick={() => removeTag(tag)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        <input
                            ref={tagInputRef}
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onFocus={() => tagInput.startsWith('@') && setShowSuggestions(true)}
                            className="tag-input-field"
                            placeholder={
                                component.lineup.length === 0 ? '@username으로 아티스트 태그' : ''
                            }
                        />
                    </div>

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="tag-autocomplete"
                            >
                                {filteredSuggestions.map((artist) => (
                                    <button
                                        key={artist.username}
                                        onClick={() => addTag(artist.username)}
                                        className="tag-autocomplete-item w-full text-left"
                                    >
                                        <Image
                                            src={artist.avatarUrl}
                                            alt={artist.displayName}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                        <div>
                                            <p className="text-warm-white text-sm">
                                                {artist.displayName}
                                            </p>
                                            <p className="text-xs text-muted">@{artist.username}</p>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <p className="mt-2 text-xs text-muted">
                    @를 입력하여 다른 아티스트를 검색하고 태그하세요
                </p>
            </div>

            {/* Description */}
            <div>
                <label className="editor-label">설명</label>
                <textarea
                    value={component.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="editor-input editor-textarea"
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
                <label className="editor-label">커버 이미지</label>
                <div className={`image-upload-area ${component.coverUrl ? 'has-image' : ''}`}>
                    {component.coverUrl ? (
                        <div className="relative aspect-square">
                            <Image
                                src={component.coverUrl}
                                alt="커버"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => onUpdate({ coverUrl: '' })}
                                className="bg-void/80 absolute right-2 top-2 rounded-lg p-2 text-white transition-colors hover:bg-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Music className="mx-auto mb-3 h-10 w-10 text-muted" />
                            <p className="text-sm text-muted">클릭하여 커버 업로드</p>
                            <p className="mt-1 text-xs text-muted/60">권장: 1:1 정사각형</p>
                            <input
                                type="text"
                                placeholder="또는 이미지 URL 입력"
                                className="editor-input mt-4 text-center"
                                onChange={(e) => onUpdate({ coverUrl: e.target.value })}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Title & Genre */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="editor-label">제목</label>
                    <input
                        type="text"
                        value={component.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="editor-input"
                        placeholder="믹스셋 제목"
                    />
                </div>
                <div>
                    <label className="editor-label">장르</label>
                    <input
                        type="text"
                        value={component.genre}
                        onChange={(e) => onUpdate({ genre: e.target.value })}
                        className="editor-input"
                        placeholder="Techno, House, etc."
                    />
                </div>
            </div>

            {/* Release Date */}
            <div>
                <label className="editor-label">발매일</label>
                <input
                    type="date"
                    value={component.releaseDate}
                    onChange={(e) => onUpdate({ releaseDate: e.target.value })}
                    className="editor-input"
                />
            </div>

            {/* SoundCloud Embed */}
            <div>
                <label className="editor-label">SoundCloud 임베드 URL</label>
                <input
                    type="text"
                    value={component.soundcloudEmbedUrl || ''}
                    onChange={(e) => onUpdate({ soundcloudEmbedUrl: e.target.value })}
                    className="editor-input"
                    placeholder="https://w.soundcloud.com/player/?url=..."
                />
                <p className="mt-2 text-xs text-muted">
                    SoundCloud 공유 → 임베드 → 코드에서 src URL 복사
                </p>
            </div>

            {/* Tracklist */}
            <div>
                <label className="editor-label">트랙리스트</label>
                <div className="space-y-2">
                    {component.tracklist.map((track, index) => (
                        <div key={index} className="tracklist-item">
                            <input
                                type="text"
                                value={track.time}
                                onChange={(e) => updateTrack(index, 'time', e.target.value)}
                                placeholder="0:00"
                                className="text-center"
                            />
                            <input
                                type="text"
                                value={track.track}
                                onChange={(e) => updateTrack(index, 'track', e.target.value)}
                                placeholder="트랙 제목"
                            />
                            <input
                                type="text"
                                value={track.artist}
                                onChange={(e) => updateTrack(index, 'artist', e.target.value)}
                                placeholder="아티스트"
                            />
                            <button
                                onClick={() => removeTrack(index)}
                                className="p-2 text-muted transition-colors hover:text-red-400"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addTrack}
                        className="hover:border-neon-cyan hover:text-neon-cyan flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-muted transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        트랙 추가
                    </button>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="editor-label">설명</label>
                <textarea
                    value={component.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="editor-input editor-textarea"
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
                <label className="editor-label">아이콘</label>
                <div className="icon-selector-grid">
                    {ICON_OPTIONS.map((icon) => {
                        const IconComponent = iconComponents[icon] || Globe;
                        return (
                            <button
                                key={icon}
                                onClick={() => onUpdate({ icon })}
                                className={`icon-selector-btn ${
                                    component.icon === icon ? 'is-selected' : ''
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
                <label className="editor-label">제목</label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="editor-input"
                    placeholder="SoundCloud, Instagram, etc."
                />
            </div>

            {/* URL */}
            <div>
                <label className="editor-label">URL</label>
                <input
                    type="url"
                    value={component.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    className="editor-input"
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}
