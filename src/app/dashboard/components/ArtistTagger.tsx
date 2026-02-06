'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, User, AtSign, Plus, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type TaggedArtist = {
    type: 'user' | 'artist';
    id: string;
    name: string;
    username?: string;
    avatar_url?: string;
    instagram?: string;
};

interface ArtistTaggerProps {
    value: TaggedArtist[];
    onChange: (artists: TaggedArtist[]) => void;
    placeholder?: string;
}

interface SearchResult {
    users: Array<{ id: string; username: string; display_name?: string; avatar_url?: string }>;
    artists: Array<{ id: string; name: string; instagram?: string }>;
}

export function ArtistTagger({
    value,
    onChange,
    placeholder = '아티스트 검색...',
}: ArtistTaggerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult>({ users: [], artists: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newArtistName, setNewArtistName] = useState('');
    const [newArtistInstagram, setNewArtistInstagram] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 검색 디바운스
    useEffect(() => {
        if (query.length < 2) {
            setResults({ users: [], artists: [] });
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/artists/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
                setShowDropdown(true);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addArtist = useCallback(
        (artist: TaggedArtist) => {
            // 중복 체크
            const exists = value.some((a) => a.type === artist.type && a.id === artist.id);
            if (!exists) {
                onChange([...value, artist]);
            }
            setQuery('');
            setShowDropdown(false);
        },
        [value, onChange]
    );

    const removeArtist = useCallback(
        (artist: TaggedArtist) => {
            onChange(value.filter((a) => !(a.type === artist.type && a.id === artist.id)));
        },
        [value, onChange]
    );

    const handleSelectUser = (user: SearchResult['users'][0]) => {
        addArtist({
            type: 'user',
            id: user.id,
            name: user.display_name || user.username,
            username: user.username,
            avatar_url: user.avatar_url,
        });
    };

    const handleSelectArtist = (artist: SearchResult['artists'][0]) => {
        addArtist({
            type: 'artist',
            id: artist.id,
            name: artist.name,
            instagram: artist.instagram,
        });
    };

    const handleCreateArtist = async () => {
        if (!newArtistName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch('/api/artists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newArtistName.trim(),
                    instagram: newArtistInstagram.trim() || undefined,
                }),
            });

            if (res.ok) {
                const { data } = await res.json();
                addArtist({
                    type: 'artist',
                    id: data.id,
                    name: data.name,
                    instagram: data.instagram,
                });
                setShowCreateModal(false);
                setNewArtistName('');
                setNewArtistInstagram('');
            }
        } catch (err) {
            console.error('Failed to create artist:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const openCreateModal = () => {
        setNewArtistName(query);
        setShowCreateModal(true);
        setShowDropdown(false);
    };

    const hasResults = results.users.length > 0 || results.artists.length > 0;

    return (
        <div ref={containerRef} className="space-y-3">
            {/* 태그된 아티스트 목록 */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((artist) => (
                        <Badge
                            key={`${artist.type}-${artist.id}`}
                            variant="secondary"
                            className="flex items-center gap-1 py-1 pl-2 pr-1"
                        >
                            {artist.type === 'user' ? (
                                <User className="h-3 w-3" />
                            ) : (
                                <AtSign className="h-3 w-3" />
                            )}
                            <span>{artist.name}</span>
                            {artist.username && (
                                <span className="text-muted-foreground">@{artist.username}</span>
                            )}
                            <button
                                type="button"
                                onClick={() => removeArtist(artist)}
                                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* 검색 입력 */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (query.length >= 2) setShowDropdown(true);
                        }}
                        placeholder={placeholder}
                        className="pl-9"
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* 검색 결과 드롭다운 */}
                {showDropdown && (
                    <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                        {/* 플랫폼 유저 */}
                        {results.users.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                    플랫폼 유저
                                </div>
                                {results.users.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => handleSelectUser(user)}
                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                                    >
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">
                                                {user.display_name || user.username}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 아티스트 레퍼런스 */}
                        {results.artists.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                    아티스트
                                </div>
                                {results.artists.map((artist) => (
                                    <button
                                        key={artist.id}
                                        type="button"
                                        onClick={() => handleSelectArtist(artist)}
                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                                    >
                                        <AtSign className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">{artist.name}</div>
                                            {artist.instagram && (
                                                <div className="text-sm text-muted-foreground">
                                                    @{artist.instagram}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 새 아티스트 추가 */}
                        {query.length >= 2 && (
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <Plus className="h-4 w-4" />
                                <span>&quot;{query}&quot; 새 아티스트로 추가</span>
                            </button>
                        )}

                        {/* 검색 결과 없음 */}
                        {!hasResults && query.length >= 2 && !isLoading && (
                            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                                검색 결과가 없습니다
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 새 아티스트 생성 모달 */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>새 아티스트 추가</DialogTitle>
                        <DialogDescription>
                            플랫폼에 등록되지 않은 아티스트를 추가합니다
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="artist-name">
                                아티스트 이름 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="artist-name"
                                value={newArtistName}
                                onChange={(e) => setNewArtistName(e.target.value)}
                                placeholder="예: DJ Shadow"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="artist-instagram">Instagram (선택)</Label>
                            <Input
                                id="artist-instagram"
                                value={newArtistInstagram}
                                onChange={(e) => setNewArtistInstagram(e.target.value)}
                                placeholder="@없이 입력"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                disabled={isCreating}
                            >
                                취소
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateArtist}
                                disabled={!newArtistName.trim() || isCreating}
                            >
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                추가
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
