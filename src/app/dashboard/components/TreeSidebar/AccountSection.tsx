'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import type { User } from '@/types';
import {
    Camera,
    ChevronUp,
    ExternalLink,
    Loader2,
    LogOut,
    Pencil,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface AccountSectionProps {
    username: string;
}

export default function AccountSection({ username }: AccountSectionProps) {
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [tempUser, setTempUser] = useState<User | null>(user);
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

    const handleOpenEditDialog = () => {
        setTempUser(user);
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!tempUser) return;

        updateUser(tempUser);
        setIsEditDialogOpen(false);

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempUser),
            });

            if (!response.ok) {
                updateUser(user);
                console.error('프로필 업데이트 실패');
            }
        } catch (error) {
            updateUser(user);
            console.error('프로필 업데이트 오류:', error);
        }
    };

    const handleCancel = () => {
        setTempUser(user);
        setIsEditDialogOpen(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tempUser) return;

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

            if (tempUser.avatarUrl?.includes('avatars')) {
                const oldPath = tempUser.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setTempUser({ ...tempUser, avatarUrl: urlData.publicUrl });
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
        if (!tempUser) return;

        setIsUploading(true);

        try {
            if (tempUser.avatarUrl?.includes('avatars')) {
                const supabase = createClient();
                const oldPath = tempUser.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            setTempUser({ ...tempUser, avatarUrl: '' });
        } catch (error) {
            console.error('아바타 삭제 오류:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // 계정 메뉴 아이템
    const accountMenuItems: DropdownMenuItemConfig[] = [
        { label: '프로필 편집', onClick: handleOpenEditDialog, icon: Pencil },
        { label: '내 페이지 보기', href: `/${username}`, icon: ExternalLink, external: true },
        { type: 'separator' },
        { label: '로그아웃', onClick: handleLogout, icon: LogOut, variant: 'danger' },
    ];

    return (
        <>
            <div className="mt-auto border-t border-dashboard-border">
                <SimpleDropdown
                    trigger={
                        <button className="flex w-full cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-dashboard-bg-hover">
                            {/* Avatar */}
                            <Avatar className="h-8 w-8 border border-dashboard-border">
                                <AvatarImage
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-dashboard-bg-active text-xs font-medium text-dashboard-text-secondary">
                                    {getInitials(user.displayName || username)}
                                </AvatarFallback>
                            </Avatar>

                            {/* User Info */}
                            <div className="min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-medium text-dashboard-text">
                                    {user.displayName || username}
                                </p>
                                <p className="truncate text-xs text-dashboard-text-muted">
                                    @{username}
                                </p>
                            </div>

                            <ChevronUp className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                        </button>
                    }
                    items={accountMenuItems}
                    align="start"
                    side="top"
                    contentClassName="w-56"
                />
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="border-dashboard-border bg-dashboard-bg-card sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-dashboard-text">프로필 편집</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Avatar 편집 */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                                className="group relative"
                            >
                                <Avatar className="h-16 w-16 border border-dashboard-border">
                                    <AvatarImage
                                        src={tempUser?.avatarUrl}
                                        alt={tempUser?.displayName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-dashboard-bg-active text-lg font-medium text-dashboard-text-secondary">
                                        {getInitials(tempUser?.displayName || username)}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={cn(
                                        'absolute inset-0 flex items-center justify-center rounded-full bg-dashboard-text/50 transition-opacity',
                                        isUploading
                                            ? 'opacity-100'
                                            : 'opacity-0 group-hover:opacity-100'
                                    )}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                    ) : (
                                        <Camera className="h-5 w-5 text-white" />
                                    )}
                                </div>
                            </button>
                            {tempUser?.avatarUrl && (
                                <Button
                                    onClick={handleDeleteAvatar}
                                    disabled={isUploading}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    사진 삭제
                                </Button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dashboard-text-secondary">
                                이름
                            </label>
                            <Input
                                type="text"
                                value={tempUser?.displayName || ''}
                                onChange={(e) =>
                                    setTempUser(
                                        tempUser
                                            ? { ...tempUser, displayName: e.target.value }
                                            : null
                                    )
                                }
                                placeholder="Display Name"
                                className="border-dashboard-border bg-dashboard-bg-card text-dashboard-text placeholder:text-dashboard-text-placeholder"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dashboard-text-secondary">
                                소개
                            </label>
                            <Textarea
                                value={tempUser?.bio || ''}
                                onChange={(e) =>
                                    setTempUser(
                                        tempUser ? { ...tempUser, bio: e.target.value } : null
                                    )
                                }
                                placeholder="자기소개를 입력하세요"
                                rows={3}
                                className="resize-none border-dashboard-border bg-dashboard-bg-card text-dashboard-text placeholder:text-dashboard-text-placeholder"
                            />
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                        >
                            <X className="mr-1 h-4 w-4" />
                            취소
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                        >
                            <Save className="mr-1 h-4 w-4" />
                            저장
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
