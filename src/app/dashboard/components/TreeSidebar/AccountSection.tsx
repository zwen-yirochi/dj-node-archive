'use client';

import { useRef, useState } from 'react';

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

import type { User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';
import { Textarea } from '@/components/ui/textarea';

import { useUser, useUserMutations } from '../../hooks';

interface AccountSectionProps {
    username: string;
}

export default function AccountSection({ username }: AccountSectionProps) {
    const user = useUser();
    const { updateProfile, uploadAvatar, deleteAvatar } = useUserMutations();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [tempUser, setTempUser] = useState<User | null>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSave = () => {
        if (!tempUser) return;

        updateProfile.mutate(
            {
                userId: user.id,
                updates: {
                    displayName: tempUser.displayName,
                    bio: tempUser.bio,
                },
            },
            {
                onError: () => console.error('Profile update failed'),
            }
        );
        setIsEditDialogOpen(false);
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
            alert('File must be under 5MB.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            alert('Only JPG, PNG, WebP, GIF are supported.');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        uploadAvatar.mutate(
            { userId: user.id, formData },
            {
                onSuccess: (data) => {
                    setTempUser((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : prev));
                },
                onError: () => alert('Image upload failed.'),
                onSettled: () => {
                    setIsUploading(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            }
        );
    };

    const handleDeleteAvatar = () => {
        if (!tempUser) return;

        setIsUploading(true);

        deleteAvatar.mutate(
            { userId: user.id },
            {
                onSuccess: () => {
                    setTempUser((prev) => (prev ? { ...prev, avatarUrl: '' } : prev));
                },
                onError: () => console.error('Avatar delete error'),
                onSettled: () => setIsUploading(false),
            }
        );
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Account menu items
    const accountMenuItems: DropdownMenuItemConfig[] = [
        { label: 'Edit profile', onClick: handleOpenEditDialog, icon: Pencil },
        { label: 'View my page', href: `/${username}`, icon: ExternalLink, external: true },
        { type: 'separator' },
        { label: 'Sign out', onClick: handleLogout, icon: LogOut, variant: 'danger' },
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
                        <DialogTitle className="text-dashboard-text">Edit profile</DialogTitle>
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
