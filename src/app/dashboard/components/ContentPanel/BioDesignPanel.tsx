'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { ChevronDown, ChevronRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

// 헤더 스타일 타입
type HeaderStyle = 'minimal' | 'banner' | 'portrait' | 'shapes';

interface HeaderStyleOption {
    id: HeaderStyle;
    label: string;
}

const HEADER_STYLES: HeaderStyleOption[] = [
    { id: 'minimal', label: 'Minimal' },
    { id: 'banner', label: 'Banner' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'shapes', label: 'Shapes' },
];

export default function BioDesignPanel() {
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const [isProfileOpen, setIsProfileOpen] = useState(true);
    const [selectedHeaderStyle, setSelectedHeaderStyle] = useState<HeaderStyle>('minimal');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            alert('JPG, PNG, WebP, GIF 형식만 지원합니다.');
            return;
        }

        setIsUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            if (user.avatarUrl?.includes('avatars')) {
                const oldPath = user.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            updateUser({ avatarUrl: urlData.publicUrl });

            await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: urlData.publicUrl }),
            });
        } catch (error) {
            console.error('아바타 업로드 오류:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteAvatar = async () => {
        setIsUploading(true);

        try {
            if (user.avatarUrl?.includes('avatars')) {
                const supabase = createClient();
                const oldPath = user.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            updateUser({ avatarUrl: '' });

            await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: '' }),
            });
        } catch (error) {
            console.error('아바타 삭제 오류:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleProfileChange = async (field: 'displayName' | 'bio', value: string) => {
        updateUser({ [field]: value });

        // Debounced save - 실제 구현시 debounce 추가 권장
        try {
            await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
        } catch (error) {
            console.error('프로필 저장 오류:', error);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-dashboard-border px-6 py-4">
                <h2 className="text-lg font-semibold text-dashboard-text">Bio Design</h2>
                <p className="text-sm text-dashboard-text-muted">
                    프로필과 페이지 스타일을 설정합니다
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Profile Section - Collapsible */}
                    <section>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex w-full items-center gap-2 text-left"
                        >
                            {isProfileOpen ? (
                                <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                            )}
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                                프로필
                            </h3>
                        </button>

                        {isProfileOpen && (
                            <div className="mt-4 space-y-4">
                                {/* Avatar + Name Row */}
                                <div className="flex items-center gap-4">
                                    {/* Avatar with Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                disabled={isUploading}
                                                className="group relative shrink-0"
                                            >
                                                <Avatar className="h-16 w-16 border-2 border-dashboard-border">
                                                    <AvatarImage
                                                        src={user.avatarUrl}
                                                        alt={user.displayName}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-dashboard-bg-active text-lg font-medium text-dashboard-text-secondary">
                                                        {getInitials(
                                                            user.displayName || user.username
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-dashboard-text/50">
                                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="w-40 border-dashboard-border bg-dashboard-bg-card"
                                        >
                                            <DropdownMenuItem
                                                onClick={() => fileInputRef.current?.click()}
                                                className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                                            >
                                                <ImagePlus className="mr-2 h-4 w-4" />
                                                이미지 업로드
                                            </DropdownMenuItem>
                                            {user.avatarUrl && (
                                                <DropdownMenuItem
                                                    onClick={handleDeleteAvatar}
                                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    삭제
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {/* Name Input */}
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={user.displayName || ''}
                                            onChange={(e) =>
                                                handleProfileChange('displayName', e.target.value)
                                            }
                                            placeholder="이름"
                                            className="border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <Textarea
                                    value={user.bio || ''}
                                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                                    placeholder="소개"
                                    rows={3}
                                    className="resize-none border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                />
                            </div>
                        )}
                    </section>

                    {/* Header Style Section */}
                    <section>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                            Header
                        </h3>

                        {/* Style Tabs */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {HEADER_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedHeaderStyle(style.id)}
                                    className={cn(
                                        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                                        selectedHeaderStyle === style.id
                                            ? 'border-dashboard-text bg-dashboard-text text-white'
                                            : 'border-dashboard-border text-dashboard-text-secondary hover:border-dashboard-border-hover'
                                    )}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>

                        {/* Style Previews */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Minimal Preview */}
                            <button
                                onClick={() => setSelectedHeaderStyle('minimal')}
                                className={cn(
                                    'rounded-xl border-2 p-4 transition-all',
                                    selectedHeaderStyle === 'minimal'
                                        ? 'border-dashboard-text'
                                        : 'border-dashboard-border hover:border-dashboard-border-hover'
                                )}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-10 w-10 rounded-full bg-dashboard-bg-active" />
                                    <div className="h-2 w-12 rounded bg-dashboard-bg-active" />
                                    <div className="flex gap-1">
                                        <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                                        <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                                        <div className="h-3 w-3 rounded-full bg-dashboard-bg-active" />
                                    </div>
                                </div>
                            </button>

                            {/* Banner Preview */}
                            <button
                                onClick={() => setSelectedHeaderStyle('banner')}
                                className={cn(
                                    'rounded-xl border-2 p-4 transition-all',
                                    selectedHeaderStyle === 'banner'
                                        ? 'border-dashboard-text'
                                        : 'border-dashboard-border hover:border-dashboard-border-hover'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-dashboard-bg-active" />
                                    <div className="flex flex-col gap-1">
                                        <div className="h-2 w-10 rounded bg-dashboard-bg-active" />
                                        <div className="flex gap-0.5">
                                            <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                                            <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                                            <div className="h-2 w-2 rounded-full bg-dashboard-bg-active" />
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Portrait Preview */}
                            <button
                                onClick={() => setSelectedHeaderStyle('portrait')}
                                className={cn(
                                    'rounded-xl border-2 p-1 transition-all',
                                    selectedHeaderStyle === 'portrait'
                                        ? 'border-dashboard-text'
                                        : 'border-dashboard-border hover:border-dashboard-border-hover'
                                )}
                            >
                                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-b from-dashboard-bg-active to-dashboard-bg-muted">
                                    <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
                                        <div className="h-2 w-10 rounded bg-white/80" />
                                        <div className="flex gap-0.5">
                                            <div className="h-2 w-2 rounded-full bg-white/60" />
                                            <div className="h-2 w-2 rounded-full bg-white/60" />
                                            <div className="h-2 w-2 rounded-full bg-white/60" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
