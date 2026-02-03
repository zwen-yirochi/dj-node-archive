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
import { useUserStore } from '@/stores/userStore';
import { ChevronDown, ChevronRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState, useTransition } from 'react';
import { deleteAvatar, updateProfile, uploadAvatar } from '../../actions/user';

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

// Debounce hook
function useDebounce<T extends (...args: Parameters<T>) => void>(callback: T, delay: number): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
}

export default function BioDesignPanel() {
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const [isProfileOpen, setIsProfileOpen] = useState(true);
    const [selectedHeaderStyle, setSelectedHeaderStyle] = useState<HeaderStyle>('minimal');
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounced save function
    const debouncedSave = useDebounce(
        async (userId: string, field: 'displayName' | 'bio', value: string) => {
            const result = await updateProfile(userId, { [field]: value });
            if (!result.success) {
                console.error('프로필 저장 오류:', result.error);
            }
        },
        500
    );

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

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const result = await uploadAvatar(user.id, formData);

            if (result.success) {
                if (result.data) {
                    updateUser({ avatarUrl: result.data.avatarUrl });
                }
            } else {
                alert(result.error);
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        });
    };

    const handleDeleteAvatar = async () => {
        startTransition(async () => {
            const result = await deleteAvatar(user.id);

            if (result.success) {
                updateUser({ avatarUrl: '' });
            } else {
                console.error('아바타 삭제 오류:', result.error);
            }
        });
    };

    const handleProfileChange = (field: 'displayName' | 'bio', value: string) => {
        // Optimistic update
        updateUser({ [field]: value });
        // Debounced save
        debouncedSave(user.id, field, value);
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
                                                disabled={isPending}
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
                                                {isPending && (
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
