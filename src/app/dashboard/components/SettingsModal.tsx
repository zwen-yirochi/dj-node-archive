'use client';

import { useRef, useState } from 'react';

import { Camera, Loader2, LogOut, Trash2, User as UserIcon } from 'lucide-react';

import type { User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useUser, useUserMutations } from '../hooks';
import { DashboardDialogContent, Dialog, DialogHeader, DialogTitle } from './ui/DashboardDialog';

// ---------------------------------------------------------------------------
// Settings section config
// ---------------------------------------------------------------------------

type SettingsSection = 'profile' | 'account';

const SETTINGS_SECTIONS: { key: SettingsSection; label: string; icon: typeof UserIcon }[] = [
    { key: 'profile', label: 'Profile', icon: UserIcon },
    { key: 'account', label: 'Account', icon: LogOut },
];

// ---------------------------------------------------------------------------
// SettingsModal
// ---------------------------------------------------------------------------

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DashboardDialogContent size="xl" className="gap-0 p-0">
                <DialogHeader className="border-b border-dashboard-border/50 px-6 py-4">
                    <DialogTitle className="text-dashboard-text">Settings</DialogTitle>
                </DialogHeader>

                <div className="flex min-h-[400px]">
                    {/* Left nav */}
                    <nav className="w-44 shrink-0 border-r border-dashboard-border/50 p-3">
                        {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                    activeSection === key
                                        ? 'bg-dashboard-bg-active font-medium text-dashboard-text'
                                        : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Right content */}
                    <div className="flex-1 p-6">
                        {activeSection === 'profile' && (
                            <ProfileSection onClose={() => onOpenChange(false)} />
                        )}
                        {activeSection === 'account' && <AccountSettingsSection />}
                    </div>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Profile Section
// ---------------------------------------------------------------------------

function ProfileSection({ onClose }: { onClose: () => void }) {
    const user = useUser();
    const { updateProfile, uploadAvatar, deleteAvatar } = useUserMutations();

    const [tempUser, setTempUser] = useState<User>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const handleSave = () => {
        updateProfile.mutate(
            {
                userId: user.id,
                updates: {
                    displayName: tempUser.displayName,
                    bio: tempUser.bio,
                },
            },
            {
                onError: () => toast({ variant: 'destructive', title: 'Profile update failed.' }),
            }
        );
        onClose();
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'File must be under 5MB.' });
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Only JPG, PNG, WebP, GIF are supported.' });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        uploadAvatar.mutate(
            { userId: user.id, formData },
            {
                onSuccess: (data) => {
                    setTempUser((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
                },
                onError: () => toast({ variant: 'destructive', title: 'Image upload failed.' }),
                onSettled: () => {
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
            }
        );
    };

    const handleDeleteAvatar = () => {
        setIsUploading(true);

        deleteAvatar.mutate(
            { userId: user.id },
            {
                onSuccess: () => {
                    setTempUser((prev) => ({ ...prev, avatarUrl: '' }));
                },
                onError: () => toast({ variant: 'destructive', title: 'Avatar delete failed.' }),
                onSettled: () => setIsUploading(false),
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="group relative"
                >
                    <Avatar className="h-16 w-16 border border-dashboard-border">
                        <AvatarImage
                            src={tempUser.avatarUrl}
                            alt={tempUser.displayName}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-dashboard-bg-active text-lg font-medium text-dashboard-text-secondary">
                            {getInitials(tempUser.displayName || user.username)}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-full bg-dashboard-text/50 transition-opacity',
                            isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                            <Camera className="h-5 w-5 text-white" />
                        )}
                    </div>
                </button>
                {tempUser.avatarUrl && (
                    <Button
                        onClick={handleDeleteAvatar}
                        disabled={isUploading}
                        variant="ghost"
                        size="sm"
                        className="text-dashboard-danger hover:bg-dashboard-danger-bg"
                    >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove photo
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
                    Display Name
                </label>
                <Input
                    type="text"
                    value={tempUser.displayName || ''}
                    onChange={(e) => setTempUser({ ...tempUser, displayName: e.target.value })}
                    placeholder="Display Name"
                    className="border-dashboard-border bg-dashboard-bg-card text-dashboard-text placeholder:text-dashboard-text-placeholder"
                />
            </div>

            {/* Bio */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-dashboard-text-secondary">Bio</label>
                <Textarea
                    value={tempUser.bio || ''}
                    onChange={(e) => setTempUser({ ...tempUser, bio: e.target.value })}
                    placeholder="Write a short bio"
                    rows={3}
                    className="resize-none border-dashboard-border bg-dashboard-bg-card text-dashboard-text placeholder:text-dashboard-text-placeholder"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                >
                    Save
                </Button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Account Section
// ---------------------------------------------------------------------------

function AccountSettingsSection() {
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-dashboard-text">Sign out</h3>
                <p className="mt-1 text-sm text-dashboard-text-muted">
                    Sign out of your account on this device.
                </p>
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-dashboard-danger hover:bg-dashboard-danger-bg"
                >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sign out
                </Button>
            </div>
        </div>
    );
}
